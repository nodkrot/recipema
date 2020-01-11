import React, { useEffect } from "react";
import Button from "antd/lib/button";
import { Link } from "react-router-dom";
import useSearchRecipes from "../utilities/useSearchRecipes";
import Header from "./Header.js";
import Footer from "./Footer.js";
import { getRecipes } from "../firebase.js";
import history from "../history.js";
import "./ListView.css";

function getItemImage(item) {
  if (item.gallery.length) {
    return (
      <img
        className="list-view__card-img"
        alt={item.name}
        src={item.gallery[item.gallery.length - 1].url}
      />
    );
  }

  return (
    <div className="list-view-card-placeholder">
      {item.name}
    </div>
  );
}

export default function ListView() {
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
          <Button shape="circle" icon="edit" size="large" onClick={handleEdit} />
        </Header>
        <h1 className="list-view__title">Recipes</h1>
        <input
          className="list-view__search"
          type="text"
          placeholder="Search recipes"
          onChange={handleSearchRecipes}
          autoComplete="off"
        />
      </div>
      <div className="list-view__cards list-view__container">
        {results.map((item) => (
          <div key={item.id} className="list-view__card">
            <Link
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
          </div>
        ))}
      </div>
      <div className="list-view__container">
        <Footer />
      </div>
    </div>
  );
}
