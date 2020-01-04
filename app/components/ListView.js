import React, { useEffect, useState } from 'react'
import Button from 'antd/lib/button'
import { Link } from 'react-router-dom'
import useSearchRecipes from '../utilities/useSearchRecipes'
import Header from './Header.js'
import Footer from './Footer.js'
import { getRecipes } from '../firebase.js'
import history from '../history.js'
import './ListView.css'

export default function ListView() {
  const [results, handleSearchRecipes, setSearchRecipes] = useSearchRecipes([])

  useEffect(() => {
    getRecipes()
      .then((recipes) => setSearchRecipes(recipes))
      .catch((err) => console.log('Cannot fetch recipes', err))
  }, [])

  function handleEdit() {
    history.push('/dashboard')
  }

  return (
    <div className="list-view">
      <div className="list-view__container">
        <Header>
          <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
        </Header>
        <h1 className="list-view__title">Recipes</h1>
      </div>
      <div className="list-view__container list-view__container--no-gutter">
        <input
          className="list-view__search"
          type="text"
          placeholder="Search recipes"
          onChange={handleSearchRecipes}
          autoComplete="off"
        />
        <ul className="list-view__list">
          {results.map((recipe) => (
            <li key={recipe.id} className="list-view__item">
              <Link to={{
                pathname: `/recipe/${recipe.id}`,
                state: { recipe }
              }}>
                <h2 className="list-view__item-title">{recipe.name}</h2>
                {recipe.description && <p className="list-view__item-description">{recipe.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="list-view__container">
        <Footer />
      </div>
    </div>
  )
}
