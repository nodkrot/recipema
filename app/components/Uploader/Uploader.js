import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Upload from 'antd/lib/upload'
import Modal from 'antd/lib/modal'
import Icon from 'antd/lib/icon'
import message from 'antd/lib/message'

function validateFile(file) {
  // Already uploaded image
  if (!(file instanceof File)) return true

  const isJPG = file.type === 'image/jpeg'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    message.error('You can only upload JPG file!')
  }

  if (!isLt2M) {
    message.error('Image must smaller than 2MB!')
  }

  return isJPG && isLt2M
}

export default class Uploader extends Component {

  static propTypes = {
    onUpload: PropTypes.func.isRequired,
    images: PropTypes.array,
    maxImages: PropTypes.number
  }

  static defaultProps = {
    images: [],
    maxImages: 3
  }

  constructor(props) {
    super(props)

    this.state = {
      previewImage: null,
      previewVisible: false,
      fileList: props.images
    }
  }

  handleChange = ({ file, fileList }) => {
    if (validateFile(file)) {
      this.setState({ fileList })
      this.props.onUpload(fileList)
    }
  }

  handlePreview = (file) => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    })
  }

  render() {
    const { maxImages } = this.props
    const { previewVisible, previewImage, fileList } = this.state
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
          onPreview={this.handlePreview}
          onChange={this.handleChange}
          beforeUpload={() => false}>
          {this.state.fileList.length >= maxImages ? null : UploadButton}
        </Upload>
        <Modal
          width="82%"
          footer={null}
          visible={previewVisible}
          bodyStyle={{ textAlign: 'center' }}
          onCancel={() => this.setState({ previewVisible: false })}>
          <img alt="example" style={{ maxWidth: '100%' }} src={previewImage} />
        </Modal>
      </div>
    )
  }
}
