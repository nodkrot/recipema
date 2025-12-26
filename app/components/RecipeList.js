import React, { useEffect } from "react";
import PropTypes from "prop-types";
import List from "antd/es/list";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Input from "antd/es/input";
import { EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import useSearchRecipes from "../utilities/useSearchRecipes";
import Messages from "../messages.json";
import "./RecipeList.css";

const messages = Messages["ru_RU"];

function trimString(str, length = 60) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export default function RecipeList({ isLoading, recipes, onEdit, onRemove }) {
  const [results, handleSearchRecipes, setSearchRecipe] = useSearchRecipes(recipes);

  useEffect(() => {
    setSearchRecipe(recipes);
  }, [recipes]);

  function handleRemove(item) {
    Modal.confirm({
      title: messages.modal_remove_title.replace("$a", item.name),
      onOk: () => onRemove(item)
    });
  }

  function renderItems(recipe) {
    const items = [
      <Button
        key="1"
        shape="circle"
        icon={<EditOutlined />}
        size="large"
        onClick={() => onEdit(recipe)}
      />,
      <Button
        key="2"
        shape="circle"
        icon={<DeleteOutlined />}
        size="large"
        onClick={() => handleRemove(recipe)}
      />
    ];

    if (recipe.gallery && recipe.gallery.length) {
      items.unshift(
        <UploadOutlined key="0" />
      );
    }

    return (
      <List.Item actions={items} onClick={() => onEdit(recipe)}>
        <List.Item.Meta title={recipe.name} description={trimString(recipe.description)} />
      </List.Item>
    );
  }

  return (
    <div className="recipe-list">
      <div className="recipe-list__search">
        <Input
          placeholder={messages.search_recipe_input}
          onChange={handleSearchRecipes}
          prefix={<SearchOutlined />}
          autoComplete="off"
          size="large"
          allowClear
        />
      </div>
      <List
        bordered
        loading={isLoading}
        itemLayout="horizontal"
        dataSource={results}
        locale={{ emptyText: messages.recipe_list_no_data }}
        renderItem={renderItems}
      />
      <small style={{ float: "right" }}>Total items: {recipes.length}</small>
    </div>
  );
}

RecipeList.propTypes = {
  recipes: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};
