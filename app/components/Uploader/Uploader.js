import React, { Component } from 'react'
import Upload from 'antd/lib/upload'
import Modal from 'antd/lib/modal'
// import Button from 'antd/lib/button'
import Icon from 'antd/lib/icon'

export default class Uploader extends Component {

  constructor(props) {
    super(props)

    this.state = {
      previewVisible: false,
      fileList: []
    }
  }

  // {
  //   uid: '-2',
  //   name: 'yyy.png',
  //   status: 'done',
  //   url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
  // }

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
          onChange={({ fileList }) => this.setState({ fileList })}
          onPreview={(file) => this.setState({
            previewImage: file.url || file.thumbUrl,
            previewVisible: true,
          })}
          beforeUpload={() => {
            console.log('here')
            return false
          }}>
          {this.state.fileList.length >= maxImages ? null : UploadButton}
        </Upload>
        <Modal
          visible={previewVisible}
          width="82%" footer={null}
          bodyStyle={{ textAlign: 'center' }}
          onCancel={() => this.setState({ previewVisible: false })}>
          <img alt="example" style={{ maxWidth: '100%' }} src={previewImage} />
        </Modal>
      </div>
    )
  }
}

Uploader.defaultProps = {
  maxImages: 100
}
