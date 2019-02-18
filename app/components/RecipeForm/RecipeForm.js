import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import Select from 'antd/lib/select'
import Upload from 'antd/lib/upload'
import Modal from 'antd/lib/modal'
import message from 'antd/lib/message'
import AutoComplete from 'antd/lib/auto-complete'
import get from 'lodash/get'
import omit from 'lodash/omit'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const units = ['piece', 'tablespoon', 'teaspoon', 'cup', 'pinch', 'clove', 'kilogram', 'gram', 'milligram', 'liter', 'milliliter', 'taste']
const filterInput = (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0

function validateFile(file) {
  // Already uploaded image
  if (!(file instanceof File)) return true

  const MAX_SIZE = 5
  const IMG_TYPES = ['image/jpeg']
  const isTypeOk = IMG_TYPES.includes(file.type)
  const isSizeOk = file.size / 1024 / 1024 < MAX_SIZE

  if (!isTypeOk) {
    message.error(`You can only upload ${IMG_TYPES.join(', ')}!`)
  }

  if (!isSizeOk) {
    message.error(`Image must smaller than ${MAX_SIZE}Mb!`)
  }

  return isTypeOk && isSizeOk
}

Ingredients.propTypes = {
  ingredients: PropTypes.array.isRequired,
  ingredientList: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired,
    getFieldDecorator: PropTypes.func.isRequired
  })
}

function Ingredients({ ingredients, ingredientList, form: { setFieldsValue, getFieldValue, getFieldDecorator } }) {
  function handleRemove(k) {
    const keys = getFieldValue('ingredientsKeys')

    setFieldsValue({ ingredientsKeys: keys.filter((_, i) => i !== k) })
  }

  return ingredients.map((val, i) => (
    <div key={i} style={{ display: 'flex' }}>
      <FormItem style={{ width: 88, marginRight: 8 }}>
        {getFieldDecorator(`ingredients[${i}].amount.value`, {
          initialValue: get(val, 'amount.value'),
          rules: [{ required: true, message: messages.recipe_form_ingredient_qty_error }]
        })(<Input size="large" type="number" placeholder={messages.recipe_form_ingredient_qty} />)}
      </FormItem>
      <FormItem style={{ width: 140, marginRight: 8 }}>
        {getFieldDecorator(`ingredients[${i}].amount.unit`, {
          initialValue: get(val, 'amount.unit'),
          rules: [{ required: true, message: messages.recipe_form_ingredient_unit_error }]
        })(
          <Select size="large" placeholder={messages.recipe_form_ingredient_unit}>
            {units.map((u, i) => <Option key={i} value={u}>{messages[`unit_${u}`]}</Option>)}
          </Select>
        )}
      </FormItem>
      <FormItem style={{ flex: 'auto' }}>
        {getFieldDecorator(`ingredients[${i}].name`, {
          initialValue: get(val, 'name'),
          rules: [{ required: true, message: messages.recipe_form_ingredient_name_error }]
        })(
          <AutoComplete
            size="large"
            placeholder={messages.recipe_form_ingredient_name}
            filterOption={filterInput}
            dataSource={ingredientList} />
        )}
      </FormItem>
      {i > 0 && <Button
        shape="circle"
        icon="close"
        className="recipe-form__action"
        onClick={() => handleRemove(i)} />}
    </div>
  ))
}

Directions.propTypes = {
  directions: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired,
    getFieldDecorator: PropTypes.func.isRequired
  })
}

function Directions({ directions, form: { setFieldsValue, getFieldValue, getFieldDecorator } }) {
  function handleRemove(k) {
    const keys = getFieldValue('directionsKeys')

    setFieldsValue({ directionsKeys: keys.filter((_, i) => i !== k) })
  }

  return directions.map((val, i) => (
    <div key={i} style={{ display: 'flex' }}>
      <div className="recipe-form__step-count">{i + 1}.</div>
      <FormItem style={{ flex: 'auto' }}>
        {getFieldDecorator(`directions[${i}].text`, {
          initialValue: get(val, 'text'),
          rules: [{ required: true, message: messages.recipe_form_direction_text_error }]
        })(<TextArea autosize={{ minRows: 2, maxRows: 4 }} placeholder={messages.recipe_form_direction_text} />)}
      </FormItem>
      {i > 0 && <Button
        shape="circle"
        icon="close"
        className="recipe-form__action"
        onClick={() => handleRemove(i)} />}
    </div>
  ))
}

Uploader.propTypes = {
  recipe: PropTypes.object,
  form: PropTypes.shape({
    getFieldDecorator: PropTypes.func.isRequired
  })
}

function Uploader({ recipe, form: { getFieldDecorator }}) {
  const [previewImage, setPreviewImage] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)

  function handlePreview(file) {
    setPreviewImage(file.url || file.thumbUrl)
    setPreviewVisible(true)
  }

  function handleCancel() {
    setPreviewVisible(false)
  }

  return (
    <FormItem>
      {getFieldDecorator('gallery', {
        valuePropName: 'fileList',
        initialValue: get(recipe, 'gallery', []),
        getValueFromEvent: (e) => validateFile(e.file) ? e.fileList : e.fileList.slice(0, -1)
      })(
        <Upload
          listType="picture-card"
          onPreview={handlePreview}
          beforeUpload={() => false}>
          <div>
            <Icon type="plus" />
            <div className="ant-upload-text">Upload</div>
          </div>
        </Upload>
      )}
      <Modal
        width="82%"
        footer={null}
        visible={previewVisible}
        bodyStyle={{ textAlign: 'center' }}
        onCancel={handleCancel}>
        <img alt="example" style={{ maxWidth: '100%' }} src={previewImage} />
      </Modal>
    </FormItem>
  )
}

function RecipeForm({
  recipe,
  recipes,
  onSubmit,
  ingredientList,
  isLoading,
  form: {
    getFieldValue,
    setFieldsValue,
    validateFields,
    getFieldDecorator
  }
}) {
  getFieldDecorator('ingredientsKeys', { initialValue: get(recipe, 'ingredients', [{}]) })
  getFieldDecorator('directionsKeys', { initialValue: get(recipe, 'directions', [{}]) })

  const ingredientsKeys = getFieldValue('ingredientsKeys')
  const directionsKeys = getFieldValue('directionsKeys')

  function handleAddField(field) {
    const keys = getFieldValue(field)

    setFieldsValue({ [field]: keys.concat(keys.length) })
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
        {recipe && <Button type="primary" shape="circle" icon="save" size="large" loading={isLoading} onClick={handleSubmit} />}
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
        })(<TextArea autosize={{ minRows: 2, maxRows: 6 }} placeholder={messages.recipe_form_description} />)}
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
      <Uploader recipe={recipe} form={{ getFieldDecorator }} />
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

RecipeForm.propTypes = {
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
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

export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    if (props.onChange) {
      props.onChange(omit(allValues, ['ingredientsKeys', 'directionsKeys']))
    }
  }
})(RecipeForm)
