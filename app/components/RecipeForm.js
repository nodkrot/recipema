import React from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import get from 'lodash/get'
import omit from 'lodash/omit'
import Ingredients from './Ingredients.js'
import Directions from './Directions.js'
import Uploader from './Uploader.js'
import Messages from '../messages.json'
import './RecipeForm.css'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const filterInput = (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0

RecipeForm.propTypes = {
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  onChange: PropTypes.func, // eslint-disable-line
  form: PropTypes.shape({
    validateFields: PropTypes.func,
    getFieldValue: PropTypes.func,
    getFieldDecorator: PropTypes.func,
    setFieldsValue: PropTypes.func
  }),
  recipes: PropTypes.array,
  ingredientList: PropTypes.arrayOf(PropTypes.string),
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

function RecipeForm({
  recipe,
  recipes,
  onSubmit,
  onPreview,
  ingredientList,
  isLoading,
  form: { getFieldValue, setFieldsValue, validateFields, getFieldDecorator }
}) {
  getFieldDecorator('ingredientsKeys', { initialValue: get(recipe, 'ingredients', [{}]) })
  getFieldDecorator('directionsKeys', { initialValue: get(recipe, 'directions', [{}]) })

  const ingredientsKeys = getFieldValue('ingredientsKeys')
  const directionsKeys = getFieldValue('directionsKeys')

  function handleAddField(field) {
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.concat(keys.length) })
  }

  function handlePreview() {
    onPreview(recipe)
  }

  function handleSubmit() {
    validateFields((err, data) => {
      if (err) return
      // Cleanup and construct recipeForm
      onSubmit(omit(data, ['ingredientsKeys', 'directionsKeys']))
    })
  }

  return (
    <Form onSubmit={handleSubmit} className="recipe-form">
      <h1 className="recipe-form__title">
        {recipe ? recipe.name : messages.app_form_title}
        <div>
          {(recipe && onPreview) && <Button shape="circle" icon="eye" size="large" onClick={handlePreview} />}{' '}
          {recipe && <Button type="primary" shape="circle" icon="save" size="large" loading={isLoading} onClick={handleSubmit} />}
        </div>
      </h1>
      <FormItem>
        {getFieldDecorator('name', {
          initialValue: get(recipe, 'name'),
          rules: [{ required: true, message: messages.recipe_form_name_error }]
        })(<Input size="large" placeholder={messages.recipe_form_name} />)}
      </FormItem>
      <FormItem>
        {getFieldDecorator('description', {
          initialValue: get(recipe, 'description', ''),
          rules: [{ required: false, message: messages.recipe_form_description_error }]
        })(<TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder={messages.recipe_form_description} />)}
      </FormItem>
      <FormItem>
        {getFieldDecorator('pairings', {
          initialValue: get(recipe, 'pairings', []),
          rules: [{ required: false, message: messages.recipe_form_description_error }]
        })(
          <Select
            size="large"
            mode="multiple"
            placeholder={messages.recipe_form_pairings}
            filterOption={filterInput}>
            {recipes.map((item, i) => <Option key={i} value={item.id}>{item.name}</Option>)}
          </Select>
        )}
      </FormItem>
      <h3>{messages.recipe_form_title_gallery}</h3>
      <Uploader gallery={get(recipe, 'gallery', [])} form={{ getFieldDecorator }} />
      <h3>{messages.recipe_form_title_ingredient}</h3>
      <Ingredients
        ingredients={ingredientsKeys}
        ingredientList={ingredientList}
        form={{ getFieldDecorator, getFieldValue, setFieldsValue }} />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField('ingredientsKeys')}>
          <Icon type="plus" /> {messages.recipe_form_add_ingredient}
        </Button>
      </FormItem>
      <h3>{messages.recipe_form_title_direction}</h3>
      <Directions
        directions={directionsKeys}
        form={{ getFieldDecorator, getFieldValue, setFieldsValue }} />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField('directionsKeys')}>
          <Icon type="plus" /> {messages.recipe_form_add_direction}
        </Button>
      </FormItem>
      <FormItem>
        <Button block size="large" type="primary" loading={isLoading} onClick={handleSubmit}>
          {messages.recipe_form_submit}
        </Button>
      </FormItem>
    </Form>
  )
}

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (props.onChange) {
      props.onChange(omit(allValues, ['ingredientsKeys', 'directionsKeys']))
    }
  }
})(RecipeForm)
