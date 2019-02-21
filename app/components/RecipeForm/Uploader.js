import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from 'antd/lib/icon'
import Form from 'antd/lib/form'
import Upload from 'antd/lib/upload'
import Modal from 'antd/lib/modal'
import message from 'antd/lib/message'
import Messages from '../../messages.json'
import './styles.css'

const FormItem = Form.Item
const messages = Messages['ru_RU']

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

Uploader.propTypes = {
  gallery: PropTypes.array.isRequired,
  form: PropTypes.shape({
    getFieldDecorator: PropTypes.func.isRequired
  })
}

export default function Uploader({ gallery, form: { getFieldDecorator }}) {
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
        initialValue: gallery,
        getValueFromEvent: (e) => validateFile(e.file) ? e.fileList : e.fileList.slice(0, -1)
      })(
        <Upload
          listType="picture-card"
          onPreview={handlePreview}
          beforeUpload={() => false}>
          <div>
            <Icon type="plus" />
            <div className="ant-upload-text">{messages.upload_button}</div>
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
