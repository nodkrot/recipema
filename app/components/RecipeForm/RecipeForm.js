import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import AutoComplete from 'antd/lib/auto-complete'
import get from 'lodash/get'
import omit from 'lodash/omit'
import Uploader from '../Uploader/Uploader.js'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const units = ['piece', 'tablespoon', 'teaspoon', 'cup', 'pinch', 'clove', 'kilogram', 'gram', 'milligram', 'liter', 'milliliter', 'taste']

const filterInput = (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0

const unitSelect = (units) => (
  <Select size="large" placeholder={messages.recipe_form_ingredient_unit}>
    {units.map((u, i) => <Option key={i} value={u}>{messages[`unit_${u}`]}</Option>)}
  </Select>
)

const pairingsSelect = (recipes) => (
  <Select
    size="large"
    mode="multiple"
    placeholder={messages.recipe_form_pairings}
    filterOption={filterInput}>
    {recipes.map((recipe, i) => <Option key={i} value={recipe.id}>{recipe.name}</Option>)}
  </Select>
)

class RecipeForm extends Component {

  static propTypes = {
    isLoading: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    form: PropTypes.shape({
      resetFields: PropTypes.func,
      validateFields: PropTypes.func,
      getFieldValue: PropTypes.func,
      getFieldDecorator: PropTypes.func
    }),
    recipes: PropTypes.array,
    ingredients: PropTypes.arrayOf(PropTypes.string),
    recipe: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      ingredients: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        amount: PropTypes.shape({
          value: PropTypes.string,
          unit: PropTypes.string
        })
      })),
      directions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string
      })),
      gallery: PropTypes.arrayOf(PropTypes.shape({
        uid: PropTypes.string,
        name: PropTypes.string,
        url: PropTypes.string
      })),
      tags: PropTypes.array,
      createdAt: PropTypes.string
    })
  }

  constructor(props) {
    super(props)

    this.state = {
      gallery: get(props, 'recipe.gallery', [])
    }
  }

  handleRemove = (field, k) => {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.filter((_, i) => i !== k) })
  }

  handleAdd = (field) => {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.concat(keys.length) })
  }

  handleFileChange = (gallery) => this.setState({ gallery })

  handleSubmit = () => {
    const { form: { validateFields, resetFields } } = this.props

    validateFields((err, data) => {
      if (err) return
      // Cleanup and construct recipeForm
      let recipeForm = Object.assign(
        omit(data, ['ingredientsKeys', 'directionsKeys']),
        { gallery: this.state.gallery }
      )

      this.props.onSubmit(recipeForm, resetFields)
    })
  }

  render() {
    const { recipe, recipes, ingredients, form: { getFieldDecorator, getFieldValue }, isLoading } = this.props

    getFieldDecorator('ingredientsKeys', { initialValue: get(recipe, 'ingredients', [0]) })
    getFieldDecorator('directionsKeys', { initialValue: get(recipe, 'directions', [0]) })

    const ingredientsKeys = getFieldValue('ingredientsKeys')
    const directionsKeys = getFieldValue('directionsKeys')

    const ingredientFields = ingredientsKeys.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <FormItem style={{ width: 88, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.value`, {
            initialValue: get(val, 'amount.value'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_qty_error }],
          })(<Input size="large" type="number" placeholder={messages.recipe_form_ingredient_qty} />)}
        </FormItem>
        <FormItem style={{ width: 140, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.unit`, {
            initialValue: get(val, 'amount.unit'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_unit_error }]
          })(unitSelect(units))}
        </FormItem>
        <FormItem style={{ flex: 'auto' }}>
          {getFieldDecorator(`ingredients[${i}].name`, {
            initialValue: get(val, 'name'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_name_error }],
          })(<AutoComplete
            size="large"
            placeholder={messages.recipe_form_ingredient_name}
            filterOption={filterInput}
            dataSource={ingredients}
          />)}
        </FormItem>
        {i > 0 && <Button
          shape="circle"
          icon="close"
          className="recipe-form__action"
          onClick={() => this.handleRemove('ingredientsKeys', i)} />}
      </div>
    ))

    const directionFields = directionsKeys.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <div className="recipe-form__step-count">{i + 1}.</div>
        <FormItem style={{ flex: 'auto' }}>
          {getFieldDecorator(`directions[${i}].text`, {
            initialValue: get(val, 'text'),
            rules: [{ required: true, message: messages.recipe_form_direction_text_error }],
          })(<TextArea autosize={{ minRows: 2, maxRows: 4 }} placeholder={messages.recipe_form_direction_text} />)}
        </FormItem>
        {i > 0 && <Button
          shape="circle"
          icon="close"
          className="recipe-form__action"
          onClick={() => this.handleRemove('directionsKeys', i)} />}
      </div>
    ))

    return (
      <Form onSubmit={this.handleSubmit} className="recipe-form">
        <h1 className="recipe-form__title">
          {recipe ? recipe.name : messages.app_form_title}
          {recipe && <Button type="primary" shape="circle" icon="save" size="large" loading={isLoading} onClick={this.handleSubmit} />}
        </h1>
        <FormItem>
          {getFieldDecorator('name', {
            initialValue: get(recipe, 'name'),
            rules: [{ required: true, message: messages.recipe_form_name_error }],
          })(<Input size="large" placeholder={messages.recipe_form_name} />)}
        </FormItem>
        <FormItem>
          {getFieldDecorator('description', {
            initialValue: get(recipe, 'description', ''),
            rules: [{ required: false, message: messages.recipe_form_description_error }],
          })(<TextArea autosize={{ minRows: 2, maxRows: 6 }} placeholder={messages.recipe_form_description} />)}
        </FormItem>
        <FormItem>
          {getFieldDecorator('pairings', {
            initialValue: get(recipe, 'pairings', []),
            rules: [{ required: false, message: messages.recipe_form_description_error }],
          })(pairingsSelect(recipes))}
        </FormItem>
        <h3>{messages.recipe_form_title_gallery}</h3>
        <FormItem>
          <Uploader onChange={this.handleFileChange} images={this.state.gallery} maxImages={5} />
        </FormItem>
        <h3>{messages.recipe_form_title_ingredient}</h3>
        {ingredientFields}
        <FormItem>
          <Button block size="large" type="dashed" onClick={() => this.handleAdd('ingredientsKeys')}>
            <Icon type="plus" /> {messages.recipe_form_add_ingredient}
          </Button>
        </FormItem>
        <h3>{messages.recipe_form_title_direction}</h3>
        {directionFields}
        <FormItem>
          <Button block size="large" type="dashed" onClick={() => this.handleAdd('directionsKeys')}>
            <Icon type="plus" /> {messages.recipe_form_add_direction}
          </Button>
        </FormItem>
        <FormItem>
          <Button block size="large" type="primary" loading={isLoading} onClick={this.handleSubmit}>
            {messages.recipe_form_submit}
          </Button>
        </FormItem>
      </Form>
    )
  }
}

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (props.onChange) {
      props.onChange(omit(allValues, ['ingredientsKeys', 'directionsKeys']))
    }
  }
})(RecipeForm)
