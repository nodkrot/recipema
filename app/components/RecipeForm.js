import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { PlusOutlined } from "@ant-design/icons";
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
  tagList = [],
  isLoading,
  isAutoSaving,
  lastAutoSaved,
  onValuesChange,
  form
}) {
  const { validateFields, getFieldValue } = form;

  // Use local state for managing dynamic field keys
  const [ingredientsKeys, setIngredientsKeys] = useState(get(recipe, "ingredients", [{}]));
  const [directionsKeys, setDirectionsKeys] = useState(get(recipe, "directions", [{}]));
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const prevRecipeIdRef = useRef(undefined);

  // Initialize form fields when recipe changes (load or switch). Do not overwrite gallery
  // when the same recipe is re-rendered so that newly selected files (originFileObj) are preserved.
  useEffect(() => {
    const recipeId = recipe?.id ?? null;
    const recipeChanged = prevRecipeIdRef.current !== recipeId;
    prevRecipeIdRef.current = recipeId;

    const ingredients = get(recipe, "ingredients", [{}]);
    const directions = get(recipe, "directions", [{}]);

    setIngredientsKeys(ingredients);
    setDirectionsKeys(directions);

    const baseValues = {
      ingredients,
      directions,
      name: get(recipe, "name"),
      description: get(recipe, "description", ""),
      pairings: get(recipe, "pairings", []),
      tags: get(recipe, "tags", [])
    };
    if (recipeChanged) {
      baseValues.gallery = get(recipe, "gallery", []);
    }
    form.setFieldsValue(baseValues);
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
      .then((data) => onSubmit(omit(data, ["ingredientsKeys", "directionsKeys"])))
      .catch(() => {
        // Validation failed; Ant Design shows field errors
      });
  }

  const isSaving = isLoading || isAutoSaving;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      onValuesChange={onValuesChange}
      className="recipe-form"
    >
      <h1 className="recipe-form__title">
        {recipe ? recipe.name : messages.app_form_title}{" "}
        <Button
          type="primary"
          size="large"
          loading={isSaving}
          onClick={handleSubmit}
        >
          {messages.recipe_form_submit}
        </Button>
      </h1>
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
          {recipes.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.name}
            </Option>
          ))}
        </Select>
      </FormItem>
      <FormItem
        name="tags"
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
          showSearch
          placeholder={messages.recipe_form_tags}
          filterOption={false}
          onSearch={setTagSearchTerm}
          optionFilterProp="children"
        >
          {(tagList || [])
            .filter((tag) => tag.toLowerCase().indexOf(tagSearchTerm.toLowerCase()) >= 0)
            .map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          {tagSearchTerm &&
            !(tagList || []).includes(tagSearchTerm) &&
            !(getFieldValue("tags") || []).includes(tagSearchTerm) && (
              <Option key={`create-${tagSearchTerm}`} value={tagSearchTerm}>
                {messages.recipe_form_tags_create} "{tagSearchTerm}"
              </Option>
            )}
        </Select>
      </FormItem>
      <h3>{messages.recipe_form_title_gallery}</h3>
      <Uploader gallery={get(recipe, "gallery", [])} />
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
  tagList: PropTypes.arrayOf(PropTypes.string),
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
  const isUserDirtyRef = useRef(false);

  useEffect(() => {
    isUserDirtyRef.current = false;
  }, [props.recipe]);

  useEffect(() => {
    if (!isUserDirtyRef.current) return;
    form
      .validateFields({ validateOnly: true })
      .then(() => props.onChange(omit(values, ["ingredientsKeys", "directionsKeys"]), true))
      .catch(() => props.onChange(omit(values, ["ingredientsKeys", "directionsKeys"]), false));
  }, [form, values]);

  function handleUserChange() {
    isUserDirtyRef.current = true;
  }

  return <RecipeFormInner {...props} form={form} onValuesChange={handleUserChange} />;
}

RecipeForm.propTypes = {
  onChange: PropTypes.func,
  isLoading: PropTypes.bool,
  isAutoSaving: PropTypes.bool,
  lastAutoSaved: PropTypes.instanceOf(Date),
  onSubmit: PropTypes.func.isRequired,
  recipes: PropTypes.array,
  ingredientList: PropTypes.arrayOf(PropTypes.string),
  tagList: PropTypes.arrayOf(PropTypes.string),
  recipe: PropTypes.object
};
