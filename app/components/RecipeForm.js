import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
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
  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;

function RecipeFormInner({
  recipe,
  recipes,
  onSubmit,
  ingredientList,
  isLoading,
  isAutoSaving,
  lastAutoSaved,
  form
}) {
  const { validateFields } = form;

  // Use local state for managing dynamic field keys
  const [ingredientsKeys, setIngredientsKeys] = useState(get(recipe, "ingredients", [{}]));
  const [directionsKeys, setDirectionsKeys] = useState(get(recipe, "directions", [{}]));

  // Initialize form fields
  useEffect(() => {
    const ingredients = get(recipe, "ingredients", [{}]);
    const directions = get(recipe, "directions", [{}]);

    setIngredientsKeys(ingredients);
    setDirectionsKeys(directions);

    form.setFieldsValue({
      ingredients: ingredients,
      directions: directions,
      name: get(recipe, "name"),
      description: get(recipe, "description", ""),
      pairings: get(recipe, "pairings", []),
      gallery: get(recipe, "gallery", [])
    });
  }, [recipe, form]);

  function handleAddField(field) {
    if (field === "ingredientsKeys") {
      setIngredientsKeys([...ingredientsKeys, {}]);
    } else if (field === "directionsKeys") {
      setDirectionsKeys([...directionsKeys, {}]);
    }
  }

  function handleRemoveField(field, index) {
    if (field === "ingredientsKeys") {
      setIngredientsKeys(ingredientsKeys.filter((_, i) => i !== index));
    } else if (field === "directionsKeys") {
      setDirectionsKeys(directionsKeys.filter((_, i) => i !== index));
    }
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

  function getAutoSaveText() {
    if (isAutoSaving) {
      return messages.autosave_saving;
    }
    if (lastAutoSaved) {
      const now = new Date();
      const diff = Math.floor((now - lastAutoSaved) / 1000);
      if (diff < 60) {
        return messages.autosave_saved_just_now;
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return messages.autosave_saved_minutes_ago.replace("$a", minutes);
      }
    }
    return null;
  }

  const isSaving = isLoading || isAutoSaving;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      className="recipe-form"
    >
      <h1 className="recipe-form__title">
        {recipe ? recipe.name : messages.app_form_title}{" "}
        {recipe && (
          <Button
            type="primary"
            shape="circle"
            icon={<SaveOutlined />}
            size="large"
            loading={isSaving}
            onClick={handleSubmit}
          />
        )}
      </h1>
      {/* {recipe && getAutoSaveText() && (
        <p className="recipe-form__autosave">
          {isAutoSaving ? (
            <CloudSyncOutlined spin style={{ marginRight: 8 }} />
          ) : (
            <CheckCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />
          )}
          {getAutoSaveText()}
        </p>
      )} */}
      <FormItem name="name" rules={[{ required: true, message: messages.recipe_form_name_error }]}>
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
        onRemove={(index) => handleRemoveField("ingredientsKeys", index)}
      />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField("ingredientsKeys")}>
          <PlusOutlined /> {messages.recipe_form_add_ingredient}
        </Button>
      </FormItem>
      <h3>{messages.recipe_form_title_direction}</h3>
      <Directions
        directions={directionsKeys}
        form={form}
        onRemove={(index) => handleRemoveField("directionsKeys", index)}
      />
      <FormItem>
        <Button block size="large" type="dashed" onClick={() => handleAddField("directionsKeys")}>
          <PlusOutlined /> {messages.recipe_form_add_direction}
        </Button>
      </FormItem>
      <FormItem>
        <Button block size="large" type="primary" loading={isSaving} onClick={handleSubmit}>
          {messages.recipe_form_submit}
        </Button>
      </FormItem>
    </Form>
  );
}

RecipeFormInner.propTypes = {
  isLoading: PropTypes.bool,
  isAutoSaving: PropTypes.bool,
  lastAutoSaved: PropTypes.instanceOf(Date),
  onSubmit: PropTypes.func.isRequired,
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
  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => props.onChange(omit(values, ["ingredientsKeys", "directionsKeys"]), true))
      .catch(() => props.onChange(omit(values, ["ingredientsKeys", "directionsKeys"]), false));
  }, [form, values]);

  return <RecipeFormInner {...props} form={form} />;
}

RecipeForm.propTypes = {
  onChange: PropTypes.func,
  isLoading: PropTypes.bool,
  isAutoSaving: PropTypes.bool,
  lastAutoSaved: PropTypes.instanceOf(Date),
  onSubmit: PropTypes.func.isRequired,
  recipes: PropTypes.array,
  ingredientList: PropTypes.arrayOf(PropTypes.string),
  recipe: PropTypes.object
};
