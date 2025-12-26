import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "antd/es/button";
import Spin from "antd/es/spin";
import { EditOutlined } from "@ant-design/icons";
import useSearchRecipes from "../utilities/useSearchRecipes";
import useScrollRestoration from "../utilities/useScrollRestoration";
import Header from "./Header.js";
import Footer from "./Footer.js";
import CachedImage from "./CachedImage.js";
import Messages from "../messages.json";
import { getRecipes } from "../utilities/firebase.js";
import "./ListView.css";

const messages = Messages["ru_RU"];

function getItemImage(item) {
  if (item.gallery && item.gallery.length) {
    return (
      <CachedImage
        className="list-view__card-img"
        alt={item.name}
        src={item.gallery[item.gallery.length - 1].url}
        placeholder={<div className="list-view-card-placeholder">{item.name}</div>}
      />
    );
  }

  return <div className="list-view-card-placeholder">{item.name}</div>;
}

export default function ListView() {
  const navigate = useNavigate();
  const [results, handleSearchRecipes, setSearchRecipes] = useSearchRecipes([]);

  // Fetch recipes using React Query
  const {
    data: recipes,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["recipes"],
    queryFn: getRecipes
  });

  // Update search recipes when data is fetched
  useEffect(() => {
    if (recipes) {
      setSearchRecipes(recipes);
    }
  }, [recipes]);

  // Use scroll restoration hook
  useScrollRestoration(
    'listview-scroll-position',
    !isLoading && results.length > 0,
    [results]
  );

  function handleEdit() {
    navigate("/dashboard");
  }

  // Handle error state
  if (isError) {
    console.error("Cannot fetch recipes", error);
  }

  return (
    <div className="list-view">
      <div className="list-view__container">
        <Header>
          <Button shape="circle" icon={<EditOutlined />} size="large" onClick={handleEdit} />
        </Header>
        <h1 className="list-view__title">{messages.app_list_title}</h1>
        <input
          className="list-view__search"
          type="text"
          placeholder={messages.search_recipe_input}
          onChange={handleSearchRecipes}
          autoComplete="off"
          disabled={isLoading}
        />
      </div>
      <div className="list-view__cards list-view__container">
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Spin size="large" />
          </div>
        ) : results.length ? (
          results.map((item) => (
            <Link
              key={item.id}
              className="list-view__card"
              to={`/recipe/${item.id}`}
              state={{ item }}
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
