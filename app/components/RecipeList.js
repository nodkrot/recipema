import React, { useEffect } from "react";
import PropTypes from "prop-types";
import List from "antd/es/list";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Input from "antd/es/input";
import Icon from "antd/es/icon";
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
      <Button key="1" shape="circle" icon="edit" size="large" onClick={() => onEdit(recipe)} />,
      <Button
        key="2"
        shape="circle"
        icon="delete"
        size="large"
        onClick={() => handleRemove(recipe)}
      />
    ];

    if (recipe.gallery && recipe.gallery.length) {
      items.unshift(<Icon key="0" type="file-image" />);
    }

    return (
      <List.Item actions={items}>
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
          prefix={<Icon type="search" />}
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
