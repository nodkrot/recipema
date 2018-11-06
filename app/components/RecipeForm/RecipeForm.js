import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import get from 'lodash/get'
import './styles.css'

const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const units = ['piece', 'gallon', 'quart', 'pint', 'cup', 'ounce', 'kilogram', 'gram', 'milligram', 'tablespoon', 'teaspoon']

const unitSelect = (
  <Select size="large" placeholder="Units">
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
    if (get(prevProps, 'recipe.id') !== get(this.props, 'recipe.id')) {
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

  handleSubmit(e) {
    const { form: { validateFields, resetFields } } = this.props

    validateFields((err, data) => {
      if (err) return
      // Clean up
      delete data.ingredientsKeys
      delete data.directionsKeys

      this.props.onSubmit(data, resetFields)
    })

    e.preventDefault()
  }

  render() {
    const { recipe, form: { getFieldDecorator, getFieldValue } } = this.props
    let ingredients, directions

    if (recipe) {
      getFieldDecorator('ingredientsKeys', { initialValue: recipe.ingredients })
      getFieldDecorator('directionsKeys', { initialValue: recipe.directions })
      ingredients = getFieldValue('ingredientsKeys')
      directions = getFieldValue('directionsKeys')
    } else {
      getFieldDecorator('ingredientsKeys', { initialValue: [0] })
      getFieldDecorator('directionsKeys', { initialValue: [0] })
      ingredients = getFieldValue('ingredientsKeys')
      directions = getFieldValue('directionsKeys')
    }

    const ingredientFields = ingredients.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <FormItem style={{ minWidth: 88, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.value`, {
            initialValue: get(val, 'amount.value'),
            rules: [{ required: true, message: 'Please input quantity' }],
          })(<Input size="large" type="number" placeholder="Qty" />)}
        </FormItem>
        <FormItem style={{ minWidth: 140, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.unit`, {
            initialValue: get(val, 'amount.unit'),
            rules: [{ required: true, message: 'Please input unit' }]
          })(unitSelect)}
        </FormItem>
        <FormItem style={{ width: '100%' }}>
          {getFieldDecorator(`ingredients[${i}].name`, {
            initialValue: get(val, 'name'),
            rules: [{ required: true, message: 'Please input ingredient' }],
          })(<Input size="large" placeholder="Ингредиент" />)}
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
        <FormItem style={{ display: 'none' }}>
          {getFieldDecorator(`directions[${i}].sequence`, {
            initialValue: i + 1,
            rules: [{ required: true }],
          })(<Input size="large" type="number" />)}
        </FormItem>
        <FormItem style={{ width: '100%' }}>
          {getFieldDecorator(`directions[${i}].text`, {
            initialValue: get(val, 'text'),
            rules: [{ required: true, message: 'Please input instruction' }],
          })(<Input size="large" placeholder="Инструкция" />)}
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
            rules: [{ required: true, message: 'Please input recipe name' }],
          })(<Input size="large" placeholder="Имя рецепта" />)}
        </FormItem>
        <FormItem>
          {getFieldDecorator('description', {
            initialValue: get(recipe, 'description'),
            rules: [{ required: true, message: 'Please input body' }],
          })(<TextArea size="large" rows={4} placeholder="Описание" />)}
        </FormItem>
        <h3>Ингредиенты</h3>
        {ingredientFields}
        <FormItem>
          <Button block size="large" type="dashed" onClick={() => this.handleAdd('ingredientsKeys')}>
            <Icon type="plus" /> Добавить ингридиент
          </Button>
        </FormItem>
        <h3>Инструкция приготовления</h3>
        {directionFields}
        <FormItem>
          <Button block size="large" type="dashed" onClick={() => this.handleAdd('directionsKeys')}>
            <Icon type="plus" />  Добавить шаг
          </Button>
        </FormItem>
        <FormItem>
          <Button block size="large" type="primary" htmlType="submit">
            Сохранить
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
      sequence: PropTypes.number,
      text: PropTypes.string
    })),
    tags: PropTypes.array,
    createdAt: PropTypes.string
  })
}

export default Form.create()(RecipeForm)
