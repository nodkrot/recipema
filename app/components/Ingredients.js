import React from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import Form from "antd/es/form";
import Input from "antd/es/input";
import Button from "antd/es/button";
import Select from "antd/es/select";
import AutoComplete from "antd/es/auto-complete";
import { CloseOutlined } from "@ant-design/icons";
import Messages from "../messages.json";
import { Flex } from "antd";

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
const filterInput = (input, option) => option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;

Ingredients.propTypes = {
  ingredients: PropTypes.array.isRequired,
  ingredientList: PropTypes.array.isRequired,
  form: PropTypes.shape({
    setFieldsValue: PropTypes.func.isRequired,
    getFieldValue: PropTypes.func.isRequired
  }),
  onRemove: PropTypes.func.isRequired
};

export default function Ingredients({
  ingredients,
  ingredientList,
  form: { setFieldsValue, getFieldValue },
  onRemove
}) {
  function handleRemove(k) {
    const currentIngredients = getFieldValue("ingredients") || ingredients;

    setFieldsValue({ ingredients: currentIngredients.filter((_, i) => i !== k) });
    onRemove(k);
  }

  return (
    <>
      {ingredients.map((val, i) => (
        <Flex key={i} align="baseline" gap={8}>
          <FormItem
            name={["ingredients", i, "amount", "value"]}
            initialValue={get(val, "amount.value")}
            rules={[
              {
                required: true,
                message: messages.recipe_form_ingredient_qty_error
              }
            ]}
          >
            <Input
              size="large"
              type="number"
              placeholder={messages.recipe_form_ingredient_qty}
              style={{ width: 80 }}
              onClick={(e) => e.target.select()}
            />
          </FormItem>
          <FormItem
            name={["ingredients", i, "amount", "unit"]}
            initialValue={get(val, "amount.unit")}
            rules={[
              {
                required: true,
                message: messages.recipe_form_ingredient_unit_error
              }
            ]}
          >
            <Select size="large" placeholder={messages.recipe_form_ingredient_unit}>
              {units.map((u, i) => (
                <Option key={i} value={u}>
                  {messages[`unit_${u}`]}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            name={["ingredients", i, "name"]}
            initialValue={get(val, "name")}
            rules={[
              {
                required: true,
                message: messages.recipe_form_ingredient_name_error
              }
            ]}
            style={{
              width: "100%",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap"
            }}
          >
            <AutoComplete
              size="large"
              placeholder={messages.recipe_form_ingredient_name}
              filterOption={filterInput}
              options={ingredientList.map((item) => ({ value: item }))}
            />
          </FormItem>
          {i > 0 && (
            <Button shape="circle" icon={<CloseOutlined />} onClick={() => handleRemove(i)} />
          )}
        </Flex>
      ))}
    </>
  );
}
