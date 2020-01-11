import React, { useEffect } from "react";
import PropTypes from "prop-types";
import List from "antd/lib/list";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Input from "antd/lib/input";
import Icon from "antd/lib/icon";
import useSearchRecipes from "../utilities/useSearchRecipes";
import Messages from "../messages.json";
import "./RecipeList.css";

const messages = Messages["ru_RU"];

function trimString(str, length = 60) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export default function RecipeList({ isLoading, recipes, onEdit, onRemove }) {
  const [results, handleSearchRecipes, setSearchRecipe] = useSearchRecipes(
    recipes
  );

  useEffect(() => {
    setSearchRecipe(recipes);
  }, [recipes]);

  function handleRemove(item) {
    Modal.confirm({
      title: messages.modal_remove_title.replace("$a", item.name),
      onOk: () => onRemove(item)
    });
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
        renderItem={item => (
          <List.Item
            actions={[
              <Button
                key="1"
                shape="circle"
                icon="edit"
                size="large"
                onClick={() => onEdit(item)}
              />,
              <Button
                key="2"
                shape="circle"
                icon="delete"
                size="large"
                onClick={() => handleRemove(item)}
              />
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={trimString(item.description)}
            />
          </List.Item>
        )}
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
