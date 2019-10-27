import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Button from 'antd/lib/button'
import Carousel from 'antd/lib/carousel'
import Header from './Header.js'
import Footer from './Footer.js'
import { getRecipeById } from '../firebase.js'
import history from '../history.js'
import Messages from '../messages.json'
import './SingleView.css'

const messages = Messages['ru_RU']

export default function SingleView({ match, location: { state = {} } }) {
  const [recipe, setRecipe] = useState(state.recipe)

  useEffect(() => {
    scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!recipe) {
      console.log('Fetching new recipe with id', match.params.recipeId)
      getRecipeById(match.params.recipeId)
        .then((fetchedRecipe) => setRecipe(fetchedRecipe))
        .catch((err) => console.log('Unable to fetch recipe with id', err))
    }
  }, [recipe])

  function handleEdit() {
    history.push(`/dashboard/${match.params.recipeId}`)
  }

  if (!recipe) return null

  return (
    <div className="single-view">
      <div className="single-view__container">
        <Header>
          <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
        </Header>
        <h1 className="single-view__title">{recipe.name}</h1>
      </div>
      {!!recipe.gallery.length && (
        <Carousel autoplay>
          {recipe.gallery.map((image, i) => (<img key={i} src={image.url} />))}
        </Carousel>
      )}
      <div className="single-view__container">
        <p className="single-view__description">{recipe.description}</p>
        <h2 className="single-view__subtitle">{messages.recipe_form_title_ingredient}</h2>
        <ul className="single-view__ingredients-list">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="single-view__list-item">
              <span className="single-view__amount">
                {ingredient.amount.value !== '0' ? ingredient.amount.value : null}
                {' '}{messages[`unit_${ingredient.amount.unit}`]}
              </span>
              {ingredient.name.toLowerCase()}
            </li>
          ))}
        </ul>
        <h2 className="single-view__subtitle">{messages.recipe_form_title_direction}</h2>
        <ol className="single-view__directions-list">
          {recipe.directions.map((direction, i) => (
            <li key={i} className="single-view__list-item">{direction.text}</li>
          ))}
        </ol>
        <Footer />
      </div>
    </div>
  )
}

SingleView.propTypes = {
  match: PropTypes.object,
  location: PropTypes.object
}
