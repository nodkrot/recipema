import React from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import Form from "antd/es/form";
import Input from "antd/es/input";
import Button from "antd/es/button";
import Select from "antd/es/select";
import AutoComplete from "antd/es/auto-complete";
import Messages from "../messages.json";

const messages = Messages["ru_RU"];
const FormItem = Form.Item;
const Option = Select.Option;
const units = [
  "piece",
  "tablespoon",
  "teaspoon",
  "cup",
  "pinch",
  "clove",
  "kilogram",
  "gram",
  "milligram",
  "liter",
  "milliliter",
  "taste"
];
const filterInput = (input, option) =>
  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;

Ingredients.propTypes = {
  ingredients: PropTypes.array.isRequired,
  ingredientList: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired,
    getFieldDecorator: PropTypes.func.isRequired
  })
};

export default function Ingredients({
  ingredients,
  ingredientList,
  form: { setFieldsValue, getFieldValue, getFieldDecorator }
}) {
  function handleRemove(k) {
    const keys = getFieldValue("ingredientsKeys");

    setFieldsValue({ ingredientsKeys: keys.filter((_, i) => i !== k) });
  }

  return (
    <>
      {ingredients.map((val, i) => (
        <div key={i} style={{ display: "flex" }}>
          <FormItem style={{ width: 88, marginRight: 8 }}>
            {getFieldDecorator(`ingredients[${i}].amount.value`, {
              initialValue: get(val, "amount.value"),
              rules: [
                {
                  required: true,
                  message: messages.recipe_form_ingredient_qty_error
                }
              ]
            })(
              <Input size="large" type="number" placeholder={messages.recipe_form_ingredient_qty} />
            )}
          </FormItem>
          <FormItem style={{ width: 140, marginRight: 8 }}>
            {getFieldDecorator(`ingredients[${i}].amount.unit`, {
              initialValue: get(val, "amount.unit"),
              rules: [
                {
                  required: true,
                  message: messages.recipe_form_ingredient_unit_error
                }
              ]
            })(
              <Select size="large" placeholder={messages.recipe_form_ingredient_unit}>
                {units.map((u, i) => (
                  <Option key={i} value={u}>
                    {messages[`unit_${u}`]}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem style={{ flex: "auto" }}>
            {getFieldDecorator(`ingredients[${i}].name`, {
              initialValue: get(val, "name"),
              rules: [
                {
                  required: true,
                  message: messages.recipe_form_ingredient_name_error
                }
              ]
            })(
              <AutoComplete
                size="large"
                placeholder={messages.recipe_form_ingredient_name}
                filterOption={filterInput}
                dataSource={ingredientList}
              />
            )}
          </FormItem>
          {i > 0 && (
            <Button
              shape="circle"
              icon="close"
              className="recipe-form__action"
              onClick={() => handleRemove(i)}
            />
          )}
        </div>
      ))}
    </>
  );
}
