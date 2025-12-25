import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { PlusOutlined, EyeOutlined, SaveOutlined } from "@ant-design/icons";
import Form from "antd/es/form";
import Input from "antd/es/input";
import Button from "antd/es/button";
import Select from "antd/es/select";
import get from "lodash/get";
import omit from "lodash/omit";
import Ingredients from "./Ingredients.js";
import Directions from "./Directions.js";
import Uploader from "./Uploader.js";
import Messages from "../messages.json";
import "./RecipeForm.css";

const messages = Messages["ru_RU"];
const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;
const filterInput = (input, option) =>
  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;

function RecipeFormInner({
  recipe,
  recipes,
  onSubmit,
  onPreview,
  ingredientList,
  isLoading,
  form
}) {
  const { getFieldValue, setFieldsValue, validateFields } = form;

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      ingredientsKeys: get(recipe, "ingredients", [{}]),
      directionsKeys: get(recipe, "directions", [{}]),
      name: get(recipe, "name"),
      description: get(recipe, "description", ""),
      pairings: get(recipe, "pairings", []),
      gallery: get(recipe, "gallery", [])
    });
  }, [recipe, form]);

  const ingredientsKeys = getFieldValue("ingredientsKeys") || [{}];
  const directionsKeys = getFieldValue("directionsKeys") || [{}];

  function handleAddField(field) {
    const keys = getFieldValue(field) || [];
    setFieldsValue({ [field]: keys.concat(keys.length) });
  }

  function handlePreview() {
    onPreview(recipe);
  }

  function handleSubmit() {
    validateFields()
      .then((data) => {
        // Cleanup and construct recipeForm
        onSubmit(omit(data, ["ingredientsKeys", "directionsKeys"]));
      })
      .catch((err) => {
        console.log("Validation error:", err);
      });
  }

  return (
    <Form form={form} onFinish={handleSubmit} className="recipe-form">
      <h1 className="recipe-form__title">
        {recipe ? recipe.name : messages.app_form_title}
        <div className="recipe-form__actions">
          {recipe && onPreview && (
            <Button shape="circle" icon={<EyeOutlined />} size="large" onClick={handlePreview} />
          )}{" "}
          {recipe && (
            <Button
              type="primary"
              shape="circle"
              icon={<SaveOutlined />}
              size="large"
              loading={isLoading}
              onClick={handleSubmit}
            />
          )}
        </div>
      </h1>
      <FormItem
        name="name"
        rules={[{ required: true, message: messages.recipe_form_name_error }]}
      >
        <Input size="large" placeholder={messages.recipe_form_name} />
      </FormItem>
      <FormItem
        name="description"
        rules={[
          {
            required: false,
            message: messages.recipe_form_description_error
          }
        ]}
      >
        <TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder={messages.recipe_form_description}
        />
      </FormItem>
      <FormItem
        name="pairings"
        rules={[
          {
            required: false,
            message: messages.recipe_form_description_error
          }
        ]}
      >
        <Select
          size="large"
          mode="multiple"
          placeholder={messages.recipe_form_pairings}
          filterOption={filterInput}
        >
          {recipes.map((item, i) => (
            <Option key={i} value={item.id}>
              {item.name}
            </Option>
          ))}
        </Select>
      </FormItem>
      <h3>{messages.recipe_form_title_gallery}</h3>
      <Uploader gallery={get(recipe, "gallery", [])} form={form} />
      <h3>{messages.recipe_form_title_ingredient}</h3>
      <Ingredients
        ingredients={ingredientsKeys}
        ingredientList={ingredientList}
        form={form}
      />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField("ingredientsKeys")}>
          <PlusOutlined /> {messages.recipe_form_add_ingredient}
        </Button>
      </FormItem>
      <h3>{messages.recipe_form_title_direction}</h3>
      <Directions directions={directionsKeys} form={form} />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField("directionsKeys")}>
          <PlusOutlined /> {messages.recipe_form_add_direction}
        </Button>
      </FormItem>
      <FormItem>
        <Button block size="large" type="primary" loading={isLoading} onClick={handleSubmit}>
          {messages.recipe_form_submit}
        </Button>
      </FormItem>
    </Form>
  );
}

RecipeFormInner.propTypes = {
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  form: PropTypes.object.isRequired,
  recipes: PropTypes.array,
  ingredientList: PropTypes.arrayOf(PropTypes.string),
  recipe: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    ingredients: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        amount: PropTypes.shape({
          value: PropTypes.string,
          unit: PropTypes.string
        })
      })
    ),
    directions: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string
      })
    ),
    gallery: PropTypes.arrayOf(
      PropTypes.shape({
        uid: PropTypes.string,
        name: PropTypes.string,
        url: PropTypes.string
      })
    ),
    pairings: PropTypes.array,
    tags: PropTypes.array,
    createdAt: PropTypes.string
  })
};

// Wrapper component to create form instance and handle onValuesChange
export default function RecipeForm(props) {
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues, allValues) => {
    if (props.onChange) {
      props.onChange(omit(allValues, ["ingredientsKeys", "directionsKeys"]));
    }
  };

  return (
    <Form form={form} onValuesChange={handleValuesChange}>
      <RecipeFormInner {...props} form={form} />
    </Form>
  );
}

RecipeForm.propTypes = {
  onChange: PropTypes.func,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onPreview: PropTypes.func,
  recipes: PropTypes.array,
  ingredientList: PropTypes.arrayOf(PropTypes.string),
  recipe: PropTypes.object
};
