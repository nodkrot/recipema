import React from "react";
import PropTypes from "prop-types";
import Form from "antd/es/form";
import Input from "antd/es/input";
import Button from "antd/es/button";
import { CloseOutlined } from "@ant-design/icons";
import get from "lodash/get";
import Messages from "../messages.json";

const messages = Messages["ru_RU"];
const FormItem = Form.Item;
const { TextArea } = Input;

Directions.propTypes = {
  directions: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired
  }),
  onRemove: PropTypes.func.isRequired
};

export default function Directions({
  directions,
  form: { setFieldsValue, getFieldValue },
  onRemove
}) {
  function handleRemove(k) {
    const currentDirections = getFieldValue("directions") || directions;

    setFieldsValue({ directions: currentDirections.filter((_, i) => i !== k) });
    onRemove(k);
  }

  return (
    <>
      {directions.map((val, i) => (
        <div key={i} style={{ display: "flex" }}>
          <div className="recipe-form__step-count">{i + 1}.</div>
          <FormItem
            name={["directions", i, "text"]}
            initialValue={get(val, "text")}
            rules={[
              {
                required: true,
                message: messages.recipe_form_direction_text_error
              }
            ]}
            style={{ flex: "auto" }}
          >
            <TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder={messages.recipe_form_direction_text}
            />
          </FormItem>
          {i > 0 && (
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              className="recipe-form__action"
              onClick={() => handleRemove(i)}
            />
          )}
        </div>
      ))}
    </>
  );
}
