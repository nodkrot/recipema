import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Upload from 'antd/lib/upload'
import Modal from 'antd/lib/modal'
import Icon from 'antd/lib/icon'
import message from 'antd/lib/message'

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

export default function Uploader({ images, maxImages, onChange }) {
  const [previewImage, setPreviewImage] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [fileList, setFileList] = useState(images)

  function handleChange({ file, fileList }) {
    if (validateFile(file)) {
      setFileList(fileList)
      onChange(fileList)
    }
  }

  function handlePreview(file) {
    setPreviewImage(file.url || file.thumbUrl)
    setPreviewVisible(true)
  }

  function handleCancel() {
    setPreviewVisible(false)
  }

  const UploadButton = (
    <div>
      <Icon type="plus" />
      <div className="ant-upload-text">Upload</div>
    </div>
  )

  return (
    <div>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={() => false}
      >
        {fileList.length >= maxImages ? null : UploadButton}
      </Upload>
      <Modal
        width="82%"
        footer={null}
        visible={previewVisible}
        bodyStyle={{ textAlign: 'center' }}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ maxWidth: '100%' }} src={previewImage} />
      </Modal>
    </div>
  )
}

Uploader.propTypes = {
  onChange: PropTypes.func.isRequired,
  images: PropTypes.array,
  maxImages: PropTypes.number
}

Uploader.defaultProps = {
  images: [],
  maxImages: 3
}
