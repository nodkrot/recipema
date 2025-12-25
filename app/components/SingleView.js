import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "antd/es/button";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Carousel from "antd/es/carousel";
import Header from "./Header.js";
import Footer from "./Footer.js";
import { getRecipeById } from "../utilities/firebase.js";
import Messages from "../messages.json";
import "./SingleView.css";

const messages = Messages["ru_RU"];

export default function SingleView() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const [recipe, setRecipe] = useState(state.item);

  useEffect(() => {
    scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!recipe) {
      console.log("Fetching new recipe with id", recipeId);
      getRecipeById(recipeId)
        .then((fetchedRecipe) => setRecipe(fetchedRecipe))
        .catch((err) => console.log("Unable to fetch recipe with id", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  function handleEdit() {
    navigate(`/dashboard/${recipeId}`);
  }

  // function handleNavClick(item) {
  //   history.push(`/recipe/${item.id}`);
  // }

  // if (state.prev) {
  //   navButtons.push(
  //     <Button key="0" onClick={() => handleNavClick(state.prev)}>
  //       Previous
  //     </Button>
  //   );
  // }

  // if (state.next) {
  //   navButtons.push(
  //     <Button key="1" onClick={() => handleNavClick(state.next)}>
  //       Next
  //     </Button>
  //   );
  // }

  if (!recipe) return null;

  return (
    <div className="single-view">
      <div className="single-view__container">
        <Header>
          <Button shape="circle" icon={<EditOutlined />} size="large" onClick={handleEdit} />
        </Header>
        <div className="single-view__page-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            size="large"
          />
          <h1 className="single-view__page-title">{recipe.name}</h1>
        </div>
      </div>
      {!!(recipe.gallery && recipe.gallery.length) && (
        <div className="single-view__gallery">
          <Carousel autoplay>
            {recipe.gallery.map((image, i) => (
              <img key={i} src={image.url} />
            ))}
          </Carousel>
        </div>
      )}
      <div className="single-view__container">
        <p className="single-view__description">{recipe.description}</p>
        <h2 className="single-view__subtitle">{messages.recipe_form_title_ingredient}</h2>
        <ul className="single-view__ingredients-list">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="single-view__list-item">
              <span className="single-view__amount">
                {ingredient.amount.value !== "0" ? ingredient.amount.value : null}{" "}
                {messages[`unit_${ingredient.amount.unit}`]}
              </span>
              {ingredient.name.toLowerCase()}
            </li>
          ))}
        </ul>
        <h2 className="single-view__subtitle">{messages.recipe_form_title_direction}</h2>
        <ol className="single-view__directions-list">
          {recipe.directions.map((direction, i) => (
            <li key={i} className="single-view__list-item">
              {direction.text}
            </li>
          ))}
        </ol>
        <Footer />
      </div>
    </div>
  );
}

