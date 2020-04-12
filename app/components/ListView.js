import React, { useEffect, useContext } from "react";
import Button from "antd/es/button";
import { Link } from "react-router-dom";
import useSearchRecipes from "../utilities/useSearchRecipes";
import Header from "./Header.js";
import Footer from "./Footer.js";
import Messages from "../messages.json";
import { getRecipes } from "../utilities/firebase.js";
import history from "../utilities/history.js";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import "./ListView.css";

const messages = Messages["ru_RU"];

function getItemImage(item) {
  if (item.gallery && item.gallery.length) {
    return (
      <img
        className="list-view__card-img"
        alt={item.name}
        src={item.gallery[item.gallery.length - 1].url}
      />
    );
  }

  return <div className="list-view-card-placeholder">{item.name}</div>;
}

export default function ListView() {
  const [{ user }] = useContext(Context);
  const [results, handleSearchRecipes, setSearchRecipes] = useSearchRecipes([]);

  useEffect(() => {
    getRecipes()
      .then((recipes) => setSearchRecipes(recipes))
      .catch((err) => console.log("Cannot fetch recipes", err));
  }, []);

  function handleEdit() {
    history.push("/dashboard");
  }

  return (
    <div className="list-view">
      <div className="list-view__container">
        <Header>
          {user && user.role === UserRoles.ADMIN && (
            <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
          )}
        </Header>
        <h1 className="list-view__title">{messages.app_list_title}</h1>
        <input
          className="list-view__search"
          type="text"
          placeholder={messages.search_recipe_input}
          onChange={handleSearchRecipes}
          autoComplete="off"
        />
      </div>
      <div className="list-view__cards list-view__container">
        {results.length ? (
          results.map((item) => (
            <Link
              key={item.id}
              className="list-view__card"
              to={{
                pathname: `/recipe/${item.id}`,
                state: { item }
              }}
            >
              {getItemImage(item)}
              <div className="list-view__card-caption">
                <div className="list-view__card-title">{item.name}</div>
                <div className="list-view__card-description">{item.description}</div>
              </div>
            </Link>
          ))
        ) : (
          <p className="list-view__no-results">{messages.recipe_list_no_data}</p>
        )}
      </div>
      <div className="list-view__container">
        <Footer />
      </div>
    </div>
  );
}
