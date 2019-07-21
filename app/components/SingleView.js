import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Button from 'antd/lib/button'
import Header from './Header.js'
import Footer from './Footer.js'
import { getRecipeById } from '../firebase.js'
import history from '../history.js'
import './SingleView.css'

export default function SingleView({ match, location: { state = {} } }) {
  const [recipe, setRecipe] = useState(state.recipe)

  useEffect(() => {
    if (!recipe) {
      console.log('Fetching new recipe with id', match.params.recipeId)
      getRecipeById(match.params.recipeId)
        .then((fetchedRecipe) => setRecipe(fetchedRecipe))
        .catch((err) => console.log('Unable to fetch recipe with id', err))
    }
  }, [recipe])

  function handleEdit() {
    history.push('/dashboard')
  }

  if (!recipe) return null
  console.log(recipe)
  return (
    <div className="single-view">
      <Row type="flex" justify="center">
        <Col xs={18}>
          <Header>
            <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
          </Header>
          <h1 className="single-view__title">{recipe.name}</h1>
          <p className="single-view__description">{recipe.description}</p>
          <Row type="flex">
            <Col xs={18} sm={12}>
              <h2 className="single-view__subtitle">Ingredients</h2>
              <ul className="single-view__list">
                {recipe.ingredients.map((ingredient, i) => (
                  <li key={i} className="single-view__list-item">
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </Col>
            <Col xs={18} sm={12}>
              <h2 className="single-view__subtitle">Directions</h2>
              <ol className="single-view__list">
                {recipe.directions.map((direction, i) => (
                  <li key={i} className="single-view__list-item">{direction.text}</li>
                ))}
              </ol>
            </Col>
          </Row>
          <Footer />
        </Col>
      </Row>
    </div>
  )
}

SingleView.propTypes = {
  match: PropTypes.object,
  location: PropTypes.object
}
