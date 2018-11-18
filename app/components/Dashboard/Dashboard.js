import React, { Component } from 'react'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import { confirm } from 'antd/lib/modal'
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
      recipes: [],
      isSaving: false,
      isFetching: false
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleEdit = this.handleEdit.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleNew = this.handleNew.bind(this)
  }

  fetchRecipes() {
    this.setState({ isFetching: true })

    getRecipes()
      .then((recipes) => this.setState({ recipes, isFetching: false }))
      .catch((err) => console.log(err))
  }

  componentDidMount() {
    this.fetchRecipes()
  }

  // `recipe` thats returned on update is not original `recipe` object
  // hence we need to perform cleaning and grab the id from `this.state`
  // We also need to `resetFields` because after submit the form caches the fields
  handleSubmit(recipe, resetFields) {
    this.setState({ isSaving: true })

    const promise = this.state.currentRecipe
      ? updateRecipe(this.state.currentRecipe.id, recipe)
      : createRecipe(recipe)

    promise
      .then(() => {
        resetFields()
        this.fetchRecipes()
        this.setState({ isSaving: false, currentRecipe: null })
        window.scrollTo(0, 0)
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
    confirm({
      title: messages.modal_new_recipe_title,
      onOk: () => this.setState({ currentRecipe: null })
    })
  }

  render() {
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
              <h1>
                {this.state.currentRecipe ? this.state.currentRecipe.name : messages.app_form_title}
              </h1>
              <RecipeForm
                recipe={this.state.currentRecipe}
                recipes={this.state.recipes}
                onSubmit={this.handleSubmit}
                isLoading={this.state.isSaving} />
            </Col>
            <Col xs={24} sm={10}>
              <h1 className="dashboard__title">
                {messages.app_list_title}
                <Button type="primary" shape="circle" icon="form" size="large" onClick={this.handleNew} />
              </h1>
              <RecipeList
                recipes={this.state.recipes}
                isLoading={this.state.isFetching}
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
