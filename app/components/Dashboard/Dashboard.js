import React, { Component } from 'react'
import get from 'lodash/get'
import uniqueId from 'lodash/uniqueId'
import differenceWith from 'lodash/differenceWith'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import Modal from 'antd/lib/modal'
import message from 'antd/lib/message'
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

export default class Dashboard extends Component {

  state = {
    uniqueId: uniqueId(),
    currentRecipe: null,
    recipes: [],
    rawIngredients: [],
    isSaving: false,
    isFetching: false
  }

  fetchRecipes() {
    this.setState({ isFetching: true })

    getRecipes().then((recipes) => {
      this.setState({
        recipes,
        rawIngredients: extractRawIngredients(recipes),
        isFetching: false
      })
    }).catch(() => message.error(messages.notification_failure))
  }

  componentDidMount() {
    this.fetchRecipes()
  }

  handleSubmit = (recipe) => {
    this.setState({ isSaving: true })

    const originalImages = get(this.state, 'currentRecipe.gallery', [])
    const newImages = recipe.gallery.filter((image) => !!image.originFileObj)
    const oldImages = recipe.gallery.filter((image) => !image.originFileObj)
    const deletedImages = differenceWith(originalImages, oldImages, (a, b) => a.uid === b.uid)
    // console.log(newImages, oldImages, deletedImages)

    Promise.all([
      ...oldImages,
      ...newImages.map((image) => createImage(image.originFileObj)),
      ...deletedImages.map((image) => deleteImage(image.name))
    ]).then((finalGallery) => {
      // Cleanup deleted images that come as `undefined`
      recipe.gallery = finalGallery.filter(Boolean)

      // `recipe` thats returned on update is not original `recipe` object
      // hence we need to perform cleaning and grab the id from `this.state`
      if (this.state.currentRecipe) {
        return updateRecipe(this.state.currentRecipe.id, recipe).then(() => {
          message.success(messages.notification_successfully_updated)
        })
      } else {
        return createRecipe(recipe).then(() => {
          message.success(messages.notification_successfully_created)
        })
      }
    }).then(() => {
      // Regenerate `uniqueId` to reset RecipeForm
      this.setState({ isSaving: false, uniqueId: uniqueId() })
      this.fetchRecipes()
    }).catch(() => {
      this.setState({ isSaving: false })
      message.error(messages.notification_failure)
    })
  }

  handleSignOut = () => {
    auth.signOut().catch(() => message.error(message.notification_failure))
  }

  handleRemove = (recipe) => {
    Promise.all((recipe.gallery || []).map((image) => deleteImage(image.name)))
      .then(() => {
        return deleteRecipe(recipe.id).then(() => {
          this.setState({ currentRecipe: null })
          this.fetchRecipes()
          message.success(messages.notification_successfully_deleted)
        })
      })
      .catch(() => message.error(messages.notification_failure))
  }

  handleEdit = (recipe) => {
    this.setState({ currentRecipe: recipe })
    // If on mobile then scroll to the top of the screen
    if (window.innerWidth < 415) {
      window.scrollTo(0, 0)
    }
  }

  handleNew = () => {
    Modal.confirm({
      title: messages.modal_new_recipe_title,
      onOk: () => this.setState({ currentRecipe: null })
    })
  }

  render() {
    const { uniqueId, currentRecipe, recipes, rawIngredients, isSaving, isFetching } = this.state

    return (
      <Layout className="dashboard">
        <Header className="dashboard__header">
          <span className="dashboard__header-space" />
          <a href="/" className="dashboard__logo">RecipeMa</a>
          <Button shape="circle" icon="logout" size="large" onClick={this.handleSignOut} />
        </Header>
        <Content className="dashboard__content">
          <Row type="flex" justify="center" gutter={16}>
            <Col xs={24} sm={14}>
              <RecipeForm
                key={currentRecipe ? currentRecipe.id : uniqueId}
                recipe={currentRecipe}
                recipes={recipes}
                ingredients={rawIngredients}
                onChange={this.handleFormChange}
                onSubmit={this.handleSubmit}
                isLoading={isSaving} />
            </Col>
            <Col xs={24} sm={10}>
              <h1 className="dashboard__title">
                {messages.app_list_title}
                <Button type="primary" shape="circle" icon="plus" size="large" onClick={this.handleNew} />
              </h1>
              <RecipeList
                recipes={recipes}
                isLoading={isFetching}
                onEdit={this.handleEdit}
                onRemove={this.handleRemove} />
            </Col>
          </Row>
        </Content>
        <Footer className="dashboard__footer">
          Made with <Icon type="heart" /> {new Date().getFullYear()}
        </Footer>
      </Layout>
    )
  }
}
