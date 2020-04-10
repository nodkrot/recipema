import React, { useState } from "react";
import PropTypes from "prop-types";
import Icon from "antd/lib/icon";
import Form from "antd/lib/form";
import Upload from "antd/lib/upload";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import message from "antd/lib/message";
import Messages from "../messages.json";
import "./Uploader.css";

const FormItem = Form.Item;
const messages = Messages["ru_RU"];

function sanitizeFiles({ file, fileList }) {
  const MAX_SIZE = 5;
  const IMG_TYPES = ["image/jpeg"];
  const matchesType = (file) => IMG_TYPES.includes(file.type);
  const matchesSize = (file) => file.size / 1024 / 1024 < MAX_SIZE;
  // `file` in `fileList` is not na instance of `File` so we check
  //  for `originFileObj` property instead
  const uploadedFiles = fileList.filter((file) => !file.originFileObj);
  const rawFiles = fileList.filter((file) => !!file.originFileObj);
  const sanitizedFiles = rawFiles.filter(matchesType).filter(matchesSize);

  if (file instanceof File && !matchesType(file)) {
    message.error(`Image must be of type(s) ${IMG_TYPES.join(", ")}!`);
  }
  if (file instanceof File && !matchesSize(file)) {
    message.error(`Image must be smaller than ${MAX_SIZE}Mb!`);
  }

  return [...uploadedFiles, ...sanitizedFiles];
}

Uploader.propTypes = {
  gallery: PropTypes.array.isRequired,
  form: PropTypes.shape({
    getFieldDecorator: PropTypes.func.isRequired
  })
};

export default function Uploader({ gallery, form: { getFieldDecorator } }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  function handlePreview(file) {
    // We need to upload the file first to get `file.url`
    // in order to preview large size
    setPreviewImage(file.url || file.thumbUrl);
    setPreviewVisible(true);
  }

  function handleCancel() {
    setPreviewVisible(false);
  }

  return (
    <div className="uploader">
      <FormItem>
        {getFieldDecorator("gallery", {
          valuePropName: "fileList",
          initialValue: gallery,
          getValueFromEvent: sanitizeFiles
        })(
          <Upload listType="picture" onPreview={handlePreview} beforeUpload={() => false} multiple>
            <Button size="large">
              <Icon type="upload" /> {messages.upload_button}
            </Button>
          </Upload>
        )}
        <Modal
          width="82%"
          footer={null}
          visible={previewVisible}
          bodyStyle={{ textAlign: "center" }}
          onCancel={handleCancel}
        >
          <img alt="example" style={{ maxWidth: "100%" }} src={previewImage} />
        </Modal>
      </FormItem>
    </div>
  );
}
