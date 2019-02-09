import React, { useState, useEffect } from 'react'
import uniqueId from 'lodash/uniqueId'
import differenceWith from 'lodash/differenceWith'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import Modal from 'antd/lib/modal'
import message from 'antd/lib/message'
import imageCompression from 'browser-image-compression'
import RecipeForm from '../RecipeForm/RecipeForm.js'
import RecipeList from '../RecipeList/RecipeList.js'
import { auth, createImage, deleteImage, getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../firebase.js'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const { Header, Content, Footer } = Layout

function extractRawIngredients(recipes) {
  const set = new Set()
  recipes.forEach((recipe) => recipe.ingredients.forEach((a) => set.add(a.name)))

  return [...set]
}

async function compressImage(image) {
  const imageFile = image.originFileObj
  const compressedFile = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1920 })

  return { ...image, originFileObj: compressedFile }
}

export default function Dashboard() {
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [newRecipeId, setNewRecipeId] = useState(uniqueId())
  const [recipes, setRecipes] = useState([])
  const [rawIngredients, setRawIngredients] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  async function fetchRecipes() {
    setIsFetching(true)

    try {
      const recipes = await getRecipes()

      setRecipes(recipes)
      setRawIngredients(extractRawIngredients(recipes))
    } catch(err) {
      message.error(messages.notification_failure)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => { fetchRecipes() }, [])

  async function handleSubmit(recipe) {
    setIsSaving(true)

    const originalImages = currentRecipe ? currentRecipe.gallery : []
    const newImages = recipe.gallery.filter((image) => !!image.originFileObj)
    const oldImages = recipe.gallery.filter((image) => !image.originFileObj)
    const deletedImages = differenceWith(originalImages, oldImages, (a, b) => a.uid === b.uid)

    try {
      const compressedNewImages = await Promise.all(newImages.map(compressImage))
      const finalGallery = await Promise.all([
        ...oldImages,
        ...compressedNewImages.map(createImage),
        ...deletedImages.map(deleteImage)
      ])

      // Cleanup deleted images that come as `undefined`
      const finalRecipe = Object.assign({}, recipe, { gallery: finalGallery.filter(Boolean) })

      // `recipe` thats returned on update is not original `recipe` object
      // hence we need to perform cleaning and grab the id from `currentRecipe` state
      if (currentRecipe) {
        updateRecipe(currentRecipe.id, finalRecipe).then((updatedCurrentRecipe) => {
          setCurrentRecipe(updatedCurrentRecipe)
          message.success(messages.notification_successfully_updated)
        })
      } else {
        createRecipe(finalRecipe).then((createdCurrentRecipe) => {
          setCurrentRecipe(createdCurrentRecipe)
          message.success(messages.notification_successfully_created)
        })
      }

      fetchRecipes()
    } catch(err) {
      message.error(messages.notification_failure)
    } finally {
      setIsSaving(false)
    }
  }

  function handleSignOut() {
    auth.signOut().catch(() => message.error(message.notification_failure))
  }

  async function handleRemove(recipe) {
    try {
      await Promise.all((recipe.gallery || []).map(deleteImage).concat(deleteRecipe(recipe.id)))

      setCurrentRecipe(null)
      fetchRecipes()
      message.success(messages.notification_successfully_deleted)
    } catch(err) {
      message.error(message.notification_failure)
    }
  }

  function handleEdit(recipe) {
    setCurrentRecipe(recipe)

    // If on mobile then scroll to the top of the screen
    if (window.innerWidth < 415) {
      window.scrollTo(0, 0)
    }
  }

  function handleNew() {
    Modal.confirm({
      title: messages.modal_new_recipe_title,
      onOk: () =>  {
        setCurrentRecipe(null)
        setNewRecipeId(uniqueId())
      }
    })
  }

  return (
    <Layout className="dashboard">
      <Header className="dashboard__header">
        <span className="dashboard__header-space" />
        <a href="/" className="dashboard__logo">RecipeMa</a>
        <Button shape="circle" icon="logout" size="large" onClick={handleSignOut} />
      </Header>
      <Content className="dashboard__content">
        <Row type="flex" justify="center" gutter={16}>
          <Col xs={24} sm={14}>
            <RecipeForm
              key={currentRecipe ? currentRecipe.id : newRecipeId}
              recipe={currentRecipe}
              recipes={recipes}
              ingredients={rawIngredients}
              onSubmit={handleSubmit}
              isLoading={isSaving} />
          </Col>
          <Col xs={24} sm={10}>
            <h1 className="dashboard__title">
              {messages.app_list_title}
              <Button type="primary" shape="circle" icon="plus" size="large" onClick={handleNew} />
            </h1>
            <RecipeList
              recipes={recipes}
              isLoading={isFetching}
              onEdit={handleEdit}
              onRemove={handleRemove} />
          </Col>
        </Row>
      </Content>
      <Footer className="dashboard__footer">
        Made with <Icon type="heart" /> {new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
