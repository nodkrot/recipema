import React, { useState } from "react";
import PropTypes from "prop-types";
import { UploadOutlined } from "@ant-design/icons";
import Form from "antd/es/form";
import Upload from "antd/es/upload";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import message from "antd/es/message";
import Messages from "../messages.json";
import "./Uploader.css";

const FormItem = Form.Item;
const messages = Messages["ru_RU"];

function sanitizeFiles(e) {
  // In antd 5, the event object structure has changed
  // e can be an event object or directly the file list
  const fileList = Array.isArray(e) ? e : e?.fileList || [];
  const file = e?.file;

  const MAX_SIZE = 5;
  const IMG_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const matchesType = (file) => IMG_TYPES.includes(file.type);
  const matchesSize = (file) => file.size / 1024 / 1024 < MAX_SIZE;
  // `file` in `fileList` is not an instance of `File` so we check
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
  form: PropTypes.object
};

export default function Uploader({ gallery }) {
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
      <FormItem
        name="gallery"
        valuePropName="fileList"
        initialValue={gallery}
        getValueFromEvent={sanitizeFiles}
      >
        <Upload listType="picture" onPreview={handlePreview} beforeUpload={() => false} multiple>
          <Button size="large">
            <UploadOutlined /> {messages.upload_button}
          </Button>
        </Upload>
      </FormItem>
      <Modal
        width="82%"
        footer={null}
        open={previewVisible}
        styles={{ body: { textAlign: "center" } }}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ maxWidth: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
}
