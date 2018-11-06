import React, { Component } from 'react'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import RecipeForm from './RecipeForm/RecipeForm.js'
import RecipeList from './RecipeList/RecipeList.js'
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../db.js'

const { Header, Content, Footer } = Layout

export default class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      currentRecipe: null,
      recipes: []
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleEdit = this.handleEdit.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleNew = this.handleNew.bind(this)
  }

  fetchRecipes() {
    getRecipes()
      .then((recipes) => this.setState({ recipes }))
      .catch((err) => console.log(err))
  }

  componentDidMount() {
    this.fetchRecipes()
  }

  // `recipe` thats returned on update is not original `recipe` object
  // hence we need to perform cleaning and grab the id from `this.state`
  // We also need to `resetFields` because after submit the form caches the fields
  handleSubmit(recipe, resetFields) {
    let promise

    if (this.state.currentRecipe) {
      promise = updateRecipe(this.state.currentRecipe.id, recipe)
    } else {
      promise = createRecipe(recipe)
    }

    promise
      .then(() => {
        resetFields()
        this.fetchRecipes()
        this.setState({ currentRecipe: null })
      })
      .catch((err) => console.log(err))
  }

  handleRemove(recipe) {
    deleteRecipe(recipe.id)
      .then(() => {
        this.fetchRecipes()
        // Unset `currentRecipe` in case it was deleted
        // while edited, the id will no longer be valid
        this.setState({ currentRecipe: null })
      })
      .catch((err) => console.log(err))
  }

  handleEdit(recipe) {
    this.setState({ currentRecipe: recipe })
  }

  handleNew() {
    this.setState({ currentRecipe: null })
  }

  render() {
    return (
      <Layout className="app">
        <Header className="app__header">
          <a href="/" className="app__logo">RecipeMa</a>
        </Header>
        <Content className="app__content">
          <Row type="flex" justify="center" gutter={16}>
            <Col span={14}>
              <h1 className="app__title">
                {this.state.currentRecipe ? this.state.currentRecipe.name : 'New Recipe'}
                <Button type="primary" onClick={this.handleNew}><Icon type="plus" /></Button>
              </h1>
              <RecipeForm
                recipe={this.state.currentRecipe}
                onSubmit={this.handleSubmit} />
            </Col>
            <Col span={10}>
              <h1>Recipes</h1>
              <RecipeList
                recipes={this.state.recipes}
                onEdit={this.handleEdit}
                onRemove={this.handleRemove} />
            </Col>
          </Row>
        </Content>
        <Footer className="app__footer">
          Made with <Icon type="heart" />
        </Footer>
      </Layout>
    )
  }
}
