import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import get from 'lodash/get'
import omit from 'lodash/omit'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const units = ['piece', 'gallon', 'quart', 'pint', 'cup', 'ounce', 'kilogram', 'gram', 'milligram', 'tablespoon', 'teaspoon']

const unitSelect = (
  <Select size="large" placeholder={messages.recipe_form_ingredient_unit}>
    {units.map((u, i) => <Option key={i} value={u}>{u}</Option>)}
  </Select>
)

class RecipeForm extends Component {

  constructor(props) {
    super(props)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleAdd = this.handleAdd.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.recipe !== this.props.recipe) {
      this.props.form.resetFields()
    }
  }

  handleRemove(field, k) {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.filter((_, i) => i !== k) })
  }

  handleAdd(field) {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.concat(keys.length) })
  }

  handleSubmit() {
    const { form: { validateFields, resetFields } } = this.props

    validateFields((err, data) => {
      if (err) return
      // With clean up
      this.props.onSubmit(omit(data, ['ingredientsKeys', 'directionsKeys']), resetFields)
    })
  }

  render() {
    const { recipe, form: { getFieldDecorator, getFieldValue } } = this.props

    getFieldDecorator('ingredientsKeys', { initialValue: get(recipe, 'ingredients', [0]) })
    getFieldDecorator('directionsKeys', { initialValue: get(recipe, 'directions', [0]) })

    const ingredients = getFieldValue('ingredientsKeys')
    const directions = getFieldValue('directionsKeys')

    const ingredientFields = ingredients.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <FormItem style={{ minWidth: 88, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.value`, {
            initialValue: get(val, 'amount.value'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_qty_error }],
          })(<Input size="large" type="number" placeholder={messages.recipe_form_ingredient_qty} />)}
        </FormItem>
        <FormItem style={{ minWidth: 140, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.unit`, {
            initialValue: get(val, 'amount.unit'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_unit_error }]
          })(unitSelect)}
        </FormItem>
        <FormItem style={{ width: '100%' }}>
          {getFieldDecorator(`ingredients[${i}].name`, {
            initialValue: get(val, 'name'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_name_error }],
          })(<Input size="large" placeholder={messages.recipe_form_ingredient_name} />)}
        </FormItem>
        {i > 0 && <Icon
          className="dynamic-delete-button"
          type="minus-circle-o"
          onClick={() => this.handleRemove('ingredientsKeys', i)}
        />}
      </div>
    ))

    const directionFields = directions.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <FormItem style={{ width: '100%' }}>
          {getFieldDecorator(`directions[${i}].text`, {
            initialValue: get(val, 'text'),
            rules: [{ required: true, message: messages.recipe_form_direction_text_error }],
          })(<Input size="large" placeholder={messages.recipe_form_direction_text} />)}
        </FormItem>
        {i > 0 && <Icon
          className="dynamic-delete-button"
          type="minus-circle-o"
          onClick={() => this.handleRemove('directionsKeys', i)}
        />}
      </div>
    ))

    return (
      <Form onSubmit={this.handleSubmit}>
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
          })(<TextArea size="large" rows={4} placeholder={messages.recipe_form_description} />)}
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
          <Button block size="large" type="primary" onClick={this.handleSubmit}>
            {messages.recipe_form_submit}
          </Button>
        </FormItem>
      </Form>
    )
  }
}

RecipeForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  form: PropTypes.shape({
    resetFields: PropTypes.func,
    validateFields: PropTypes.func,
    getFieldValue: PropTypes.func,
    getFieldDecorator: PropTypes.func
  }),
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
    tags: PropTypes.array,
    createdAt: PropTypes.string
  })
}

export default Form.create()(RecipeForm)
