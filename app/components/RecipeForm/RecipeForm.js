import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import get from 'lodash/get'
import omit from 'lodash/omit'
import uniqueId from 'lodash/uniqueId'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Uploader from '../Uploader/Uploader.js'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const units = ['piece', 'tablespoon', 'teaspoon', 'cup', 'kilogram', 'gram', 'milligram', 'liter', 'milliliter', 'taste']

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
    filterOption={(input, option) => (
      option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    )}>
    {recipes.map((recipe, i) => <Option key={i} value={recipe.id}>{recipe.name}</Option>)}
  </Select>
)

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

class RecipeForm extends Component {

  constructor(props) {
    super(props)

    const { recipe, form: { getFieldDecorator } } = props

    this.state = {
      isMedia: false
    }

    getFieldDecorator('ingredientsKeys', {
      initialValue: get(recipe, 'ingredients', [0])
    })
    getFieldDecorator('directionsKeys', {
      initialValue: get(recipe, 'directions', [0]).map((d) => Object.assign({ id: uniqueId() }, d))
    })

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleAdd = this.handleAdd.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
  }

  handleRemove(field, k) {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.filter((_, i) => i !== k) })
  }

  handleAdd(field) {
    const { form: { getFieldValue, setFieldsValue } } = this.props
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.concat({ id: uniqueId() }) })
  }

  handleSubmit() {
    const { form: { validateFields, resetFields } } = this.props

    validateFields((err, data) => {
      if (err) return
      // Cleanup form data
      let recipeForm = omit(data, ['ingredientsKeys', 'directionsKeys'])
      console.log('New form', data)
      // this.props.onSubmit(recipeForm, resetFields)
    })
  }

  handleDragEnd(result) {
    // dropped outside the list
    if (!result.destination) return

    const { getFieldValue, setFieldsValue } = this.props.form
    const items = reorder(
      getFieldValue('directionsKeys'),
      result.source.index,
      result.destination.index
    )

    setFieldsValue({ directionsKeys: items })
  }

  render() {
    const { recipe, recipes, form: { getFieldDecorator, getFieldValue }, isLoading } = this.props
    const ingredients = getFieldValue('ingredientsKeys')
    const directions = getFieldValue('directionsKeys')

    const ingredientFields = ingredients.map((item, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <FormItem style={{ width: 88, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.value`, {
            initialValue: get(item, 'amount.value'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_qty_error }],
          })(<Input size="large" type="number" placeholder={messages.recipe_form_ingredient_qty} />)}
        </FormItem>
        <FormItem style={{ width: 140, marginRight: 8 }}>
          {getFieldDecorator(`ingredients[${i}].amount.unit`, {
            initialValue: get(item, 'amount.unit'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_unit_error }]
          })(unitSelect(units))}
        </FormItem>
        <FormItem style={{ flex: 'auto' }}>
          {getFieldDecorator(`ingredients[${i}].name`, {
            initialValue: get(item, 'name'),
            rules: [{ required: true, message: messages.recipe_form_ingredient_name_error }],
          })(<Input size="large" placeholder={messages.recipe_form_ingredient_name} />)}
        </FormItem>
        {i > 0 && <Button
          shape="circle"
          icon="close"
          style={{ flex: '0 0 auto' }}
          className="recipe-form__action"
          onClick={() => this.handleRemove('ingredientsKeys', i)} />}
      </div>
    ))
    console.log('Ingredients:', ingredients)
    console.log('Directions:', directions)
    const directionFields = directions.map((item, i) => (
      <Draggable key={item.id} draggableId={item.id} index={i}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div style={{ display: 'flex' }}>
              <Icon type="drag" />
              <div className="recipe-form__step-count">{i + 1}.</div>
              <FormItem style={{ flex: 'auto' }}>
                {getFieldDecorator(`directionsKeys[${i}].text`, {
                  initialValue: get(item, 'text'),
                  rules: [{ required: true, message: messages.recipe_form_direction_text_error }],
                })(<TextArea autosize={{ minRows: 2, maxRows: 4 }} placeholder={messages.recipe_form_direction_text} />)}
              </FormItem>
              {this.state.isMedia && <Button
                shape="circle"
                icon="upload"
                className="recipe-form__action"
                onClick={() => false} />}
              {i > 0 && <Button
                shape="circle"
                icon="close"
                style={{ flex: '0 0 auto' }}
                className="recipe-form__action"
                onClick={() => this.handleRemove('directionsKeys', i)} />}
            </div>
          </div>
        )}
      </Draggable>
    ))

    return (
      <Form onSubmit={this.handleSubmit} className="recipe-form">
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
        {this.state.isMedia && <FormItem>
          <Uploader maxImages={1} />
        </FormItem>}
        <h3>{messages.recipe_form_title_ingredient}</h3>
        {ingredientFields}
        <FormItem>
          <Button block size="large" type="dashed" onClick={() => this.handleAdd('ingredientsKeys')}>
            <Icon type="plus" /> {messages.recipe_form_add_ingredient}
          </Button>
        </FormItem>
        <h3>{messages.recipe_form_title_direction}</h3>
        <DragDropContext onDragEnd={this.handleDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div ref={provided.innerRef}>
                {directionFields}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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

RecipeForm.propTypes = {
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

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (props.onChange) {
      props.onChange(allValues)
    }
  }
})(RecipeForm)
