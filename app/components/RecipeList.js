import React, { useEffect } from "react";
import PropTypes from "prop-types";
import List from "antd/es/list";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Input from "antd/es/input";
import { DeleteOutlined, SearchOutlined, FileImageOutlined } from "@ant-design/icons";
import useSearchRecipes from "../utilities/useSearchRecipes";
import Messages from "../messages.json";
import "./RecipeList.css";

const messages = Messages["ru_RU"];

function trimString(str, length = 60) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export default function RecipeList({ isLoading, recipes, selectedId, onEdit, onRemove }) {
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
        key="2"
        shape="circle"
        icon={<DeleteOutlined />}
        size="large"
        onClick={() => handleRemove(recipe)}
      />
    ];

    if (recipe.gallery && recipe.gallery.length) {
      items.unshift(<FileImageOutlined key="0" />);
    }

    return (
      <List.Item
        actions={items}
        onClick={() => onEdit(recipe)}
        className={recipe.id === selectedId ? "recipe-list__item--selected" : ""}
      >
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
      <div className="recipe-list__items">
        <List
          loading={isLoading}
          itemLayout="horizontal"
          dataSource={results}
          locale={{ emptyText: messages.recipe_list_no_data }}
          renderItem={renderItems}
        />
      </div>
      <small style={{ float: "right", marginTop: 12 }}>Total items: {recipes.length}</small>
    </div>
  );
}

RecipeList.propTypes = {
  recipes: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  selectedId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};
