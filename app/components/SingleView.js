import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "antd/es/button";
import Checkbox from "antd/es/checkbox";
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

  // Fetch recipe using React Query
  const {
    data: recipe,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId),
    initialData: state.item, // Use location state as initial data if available
    enabled: !!recipeId // Only fetch if recipeId exists
  });

  // Local state for progress (no persistence): checked ingredients and directions
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [checkedDirections, setCheckedDirections] = useState([]);

  const toggleIngredient = useCallback((index) => {
    setCheckedIngredients((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const toggleDirection = useCallback((index) => {
    setCheckedDirections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  // Scroll to top when navigating to a recipe
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipeId]);

  function handleEdit() {
    navigate(`/dashboard/${recipeId}`);
  }

  // Handle error state
  if (isError) {
    console.error("Unable to fetch recipe with id", error);
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

  if (isLoading || !recipe) {
    return null;
  }

  const renderIngredients = () =>
    recipe.ingredients.map((ingredient, i) => {
      const checked = checkedIngredients.includes(i);
      return (
        <li
          key={i}
          className="single-view__list-item single-view__list-item--with-checkbox"
          onClick={() => toggleIngredient(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleIngredient(i);
            }
          }}
        >
          <span className="single-view__checkbox-wrap" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={checked}
              onChange={() => toggleIngredient(i)}
              className="single-view__checkbox"
            />
          </span>
          <span className="single-view__list-item-content">
            <span className="single-view__amount">
              {ingredient.amount.value !== "0" ? ingredient.amount.value : null}{" "}
              {messages[`unit_${ingredient.amount.unit}`]}
            </span>
            <span
              className={
                checked
                  ? "single-view__ingredient-name single-view__ingredient-name--checked"
                  : "single-view__ingredient-name"
              }
            >
              {ingredient.name.toLowerCase()}
            </span>
          </span>
        </li>
      );
    });

  return (
    <div className="single-view">
      <div className="single-view__container single-view__header-block">
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
        </div>
      </div>
      {!!(recipe.gallery && recipe.gallery.length) && (
        <div className="single-view__gallery-wrap">
          <div className="single-view__gallery">
            <Carousel autoplay arrows>
              {recipe.gallery.map((image, i) => (
                <img key={i} src={image.url} alt="" />
              ))}
            </Carousel>
          </div>
        </div>
      )}
      <div className="single-view__container single-view__main-wrap">
        <h1 className="single-view__title">{recipe.name}</h1>
        <div className="single-view__two-col">
          <div className="single-view__content">
            {recipe.description && (
              <p className="single-view__description">{recipe.description}</p>
            )}
            {/* Mobile: ingredients between description and directions */}
            <section className="single-view__section single-view__ingredients--mobile">
              <h2 className="single-view__subtitle">{messages.recipe_form_title_ingredient}</h2>
              <ul className="single-view__ingredients-list">{renderIngredients()}</ul>
            </section>
            <section className="single-view__section">
              <h2 className="single-view__subtitle">{messages.recipe_form_title_direction}</h2>
              <ol className="single-view__directions-list">
                {recipe.directions.map((direction, i) => {
                  const checked = checkedDirections.includes(i);
                  return (
                    <li
                      key={i}
                      className={`single-view__list-item single-view__list-item--with-checkbox ${checked ? "single-view__list-item--checked" : ""}`}
                      onClick={() => toggleDirection(i)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleDirection(i);
                        }
                      }}
                    >
                      <span className="single-view__checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onChange={() => toggleDirection(i)}
                          className="single-view__checkbox"
                        />
                      </span>
                      <span className="single-view__step-num">{i + 1}.</span>
                      <span className="single-view__list-item-content">{direction.text}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
          <aside className="single-view__sidebar">
            <section className="single-view__section single-view__ingredients--desktop">
              <h2 className="single-view__subtitle">{messages.recipe_form_title_ingredient}</h2>
              <ul className="single-view__ingredients-list">{renderIngredients()}</ul>
            </section>
          </aside>
        </div>
        <Footer />
      </div>
    </div>
  );
}
