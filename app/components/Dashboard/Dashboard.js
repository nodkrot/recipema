import React, { Component } from 'react'
import uniqueId from 'lodash/uniqueId'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Icon from 'antd/lib/icon'
import Layout from 'antd/lib/layout'
import Button from 'antd/lib/button'
import Modal from 'antd/lib/modal'
import notification from 'antd/lib/notification'
import RecipeForm from '../RecipeForm/RecipeForm.js'
import RecipeList from '../RecipeList/RecipeList.js'
import firebase, { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../firebase.js'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const { confirm } = Modal
const { Header, Content, Footer } = Layout

const openNotification = (title, status = 'success', message = '', exp = 3) => {
  let icon = <Icon type="check-circle" />

  if (status == 'failure') {
    icon = <Icon type="close-circle" />
  } else if (status === 'warning') {
    icon = <Icon type="exclamation-circle" />
  } else if (status === 'info') {
    icon = <Icon type="info-circle" />
  }

  notification.open({
    message: title,
    description: message,
    duration: exp,
    icon
  })
}

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
      .catch(() => openNotification(messages.notification_failure, 'failure'))
  }

  componentDidMount() {
    this.fetchRecipes()
  }

  // `recipe` thats returned on update is not original `recipe` object
  // hence we need to perform cleaning and grab the id from `this.state`
  handleSubmit(recipe) {
    this.setState({ isSaving: true })

    if (this.state.currentRecipe) {
      updateRecipe(this.state.currentRecipe.id, recipe)
        .then(() => {
          this.setState({ isSaving: false })
          this.fetchRecipes()
          openNotification(messages.notification_successfully_updated, 'success')
        })
        .catch(() => openNotification(messages.notification_failure, 'failure'))
    } else {
      createRecipe(recipe)
        .then(() => {
          this.setState({ isSaving: false })
          this.fetchRecipes()
          openNotification(messages.notification_successfully_created, 'success')
        })
        .catch(() => openNotification(messages.notification_failure, 'failure'))
    }
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
        openNotification(messages.notification_successfully_deleted, 'success')
      })
      .catch(() => openNotification(messages.notification_failure, 'failure'))
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
    const { currentRecipe, recipes, isSaving, isFetching } = this.state
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
                {currentRecipe ? currentRecipe.name : messages.app_form_title}
              </h1>
              <RecipeForm
                key={currentRecipe ? currentRecipe.id : uniqueId()}
                recipe={currentRecipe}
                recipes={recipes}
                onSubmit={this.handleSubmit}
                isLoading={isSaving} />
            </Col>
            <Col xs={24} sm={10}>
              <h1 className="dashboard__title">
                {messages.app_list_title}
                <Button type="primary" shape="circle" icon="form" size="large" onClick={this.handleNew} />
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
