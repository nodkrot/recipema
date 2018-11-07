import React, { Component } from 'react'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import Divider from 'antd/lib/divider'
import RecipeForm from '../RecipeForm/RecipeForm.js'
import RecipeList from '../RecipeList/RecipeList.js'
import firebase, { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../firebase.js'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const { Header, Content, Footer } = Layout

export default class Dashboard extends Component {

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
    const promise = this.state.currentRecipe
      ? updateRecipe(this.state.currentRecipe.id, recipe)
      : createRecipe(recipe)

    promise
      .then(() => {
        resetFields()
        this.fetchRecipes()
        this.setState({ currentRecipe: null })
      })
      .catch((err) => console.log(err))
  }

  handleSignOut() {
    firebase.auth().signOut().catch((err) => console.log(err))
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
      <Layout className="dashboard">
        <Header className="dashboard__header">
          <span className="dashboard__header-space" />
          <a href="/" className="dashboard__logo">RecipeMa</a>
          <Button type="primary" shape="circle" icon="logout" size="large" onClick={this.handleSignOut} />
        </Header>
        <Content className="dashboard__content">
          <Row type="flex" justify="center" gutter={16}>
            <Col span={14}>
              <h1 className="dashboard__title">
                {this.state.currentRecipe ? this.state.currentRecipe.name : messages.app_form_title}
              </h1>
              <RecipeForm
                recipe={this.state.currentRecipe}
                onSubmit={this.handleSubmit} />
            </Col>
            <Col span={10}>
              <h1>{messages.app_list_title}</h1>
              <Button block type="primary" onClick={this.handleNew}>
                <Icon type="plus" /> {messages.app_add_recipe}
              </Button>
              <Divider />
              <RecipeList
                recipes={this.state.recipes}
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
