import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Layout from 'antd/lib/layout'
import { getRecipes } from '../../firebase.js'
import './styles.css'

const { Content } = Layout

export default function HomePage() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    getRecipes()
      .then((recipes) => setRecipes(recipes))
      .catch((err) => console.log('Cannot fetch recipes', err))
  }, [])

  return (
    <Content className="homepage__content">
      <Row type="flex" justify="center">
        <Col xs={18}>
          {recipes.map((recipe) => (
            <section key={recipe.id}>
              <Row>
                <h1 className="homepage__title">{recipe.name}</h1>
                <p>{recipe.description}</p>
              </Row>
              <Row type="flex">
                <Col xs={18} sm={12}>
                  <h2 className="homepage__subtitle">Ingredients</h2>
                  <ul className="homepage__list">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="homepage__list-item">
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </Col>
                <Col xs={18} sm={12}>
                  <h2 className="homepage__subtitle">Directions</h2>
                  <ul className="homepage__list">
                    {recipe.directions.map((direction, i) => (
                      <ol key={i} className="homepage__list-item">{direction.text}</ol>
                    ))}
                  </ul>
                </Col>
              </Row>
            </section>
          ))}
        </Col>
      </Row>
    </Content>
  )
}
