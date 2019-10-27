import React from 'react'
import PropTypes from 'prop-types'
import Form from 'antd/lib/form'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import get from 'lodash/get'
import Messages from '../messages.json'

const messages = Messages['ru_RU']
const FormItem = Form.Item
const { TextArea } = Input

Directions.propTypes = {
  directions: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired,
    getFieldDecorator: PropTypes.func.isRequired
  })
}

export default function Directions({
  directions,
  form: { setFieldsValue, getFieldValue, getFieldDecorator }
}) {
  function handleRemove(k) {
    const keys = getFieldValue('directionsKeys')

    setFieldsValue({ directionsKeys: keys.filter((_, i) => i !== k) })
  }

  return <>
    {directions.map((val, i) => (
      <div key={i} style={{ display: 'flex' }}>
        <div className="recipe-form__step-count">{i + 1}.</div>
        <FormItem style={{ flex: 'auto' }}>
          {getFieldDecorator(`directions[${i}].text`, {
            initialValue: get(val, 'text'),
            rules: [{ required: true, message: messages.recipe_form_direction_text_error }]
          })(<TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder={messages.recipe_form_direction_text} />)}
        </FormItem>
        {i > 0 && <Button
          shape="circle"
          icon="close"
          className="recipe-form__action"
          onClick={() => handleRemove(i)} />}
      </div>
    ))}
  </>
}
