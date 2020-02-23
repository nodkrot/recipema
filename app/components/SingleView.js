import React, { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import PageHeader from "antd/lib/page-header";
import Carousel from "antd/lib/carousel";
import Header from "./Header.js";
import Footer from "./Footer.js";
import { getRecipeById } from "../utilities/firebase.js";
import history from "../utilities/history.js";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import Messages from "../messages.json";
import "./SingleView.css";

const messages = Messages["ru_RU"];

export default function SingleView({ match, location: { state = {} } }) {
  const [{ user }] = useContext(Context);
  const [recipe, setRecipe] = useState(state.item);

  useEffect(() => {
    scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!recipe) {
      console.log("Fetching new recipe with id", match.params.recipeId);
      getRecipeById(match.params.recipeId)
        .then(fetchedRecipe => setRecipe(fetchedRecipe))
        .catch(err => console.log("Unable to fetch recipe with id", err));
    }
  }, [match.params.recipeId]);

  function handleEdit() {
    history.push(`/dashboard/${match.params.recipeId}`);
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
          {user && user.role === UserRoles.ADMIN && (
            <Button
              shape="circle"
              icon="edit"
              size="large"
              onClick={handleEdit}
            />
          )}
        </Header>
        <PageHeader onBack={() => history.goBack()} title={recipe.name} />
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
        <h2 className="single-view__subtitle">
          {messages.recipe_form_title_ingredient}
        </h2>
        <ul className="single-view__ingredients-list">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="single-view__list-item">
              <span className="single-view__amount">
                {ingredient.amount.value !== "0"
                  ? ingredient.amount.value
                  : null}{" "}
                {messages[`unit_${ingredient.amount.unit}`]}
              </span>
              {ingredient.name.toLowerCase()}
            </li>
          ))}
        </ul>
        <h2 className="single-view__subtitle">
          {messages.recipe_form_title_direction}
        </h2>
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

SingleView.propTypes = {
  match: PropTypes.object,
  location: PropTypes.object
};
