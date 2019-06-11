import React, { useEffect, useState } from 'react'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Button from 'antd/lib/button'
import { Link } from 'react-router-dom'
import Header from './Header.js'
import Footer from './Footer.js'
import { getRecipes } from '../firebase.js'
import history from '../history.js'
import './ListView.css'

export default function ListView() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    getRecipes()
      .then((recipes) => setRecipes(recipes))
      .catch((err) => console.log('Cannot fetch recipes', err))
  }, [])

  function handleEdit() {
    history.push('/dashboard')
  }

  console.log(recipes)
  return (
    <div className="list-view">
      <Row type="flex" justify="center">
        <Col xs={18}>
          <Header>
            <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
          </Header>
          <h1 className="list-view__title">Recipes</h1>
          <ul className="list-view__list">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <h2><Link to={{
                  pathname: `/recipe/${recipe.id}`,
                  state: { recipe }
                }}>{recipe.name}</Link></h2>
                <p>{recipe.description}</p>
              </li>
            ))}
          </ul>
          <Footer />
        </Col>
      </Row>
    </div>
  )
}
