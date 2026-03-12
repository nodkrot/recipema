import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "antd/es/button";
import Checkbox from "antd/es/checkbox";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Carousel from "antd/es/carousel";
import Header from "./Header.js";
import Footer from "./Footer.js";
import { getRecipeById, getRecipes } from "../utilities/firebase.js";
import Messages from "../messages.json";
import "./SingleView.css";

const messages = Messages["ru_RU"];

function toggleIndex(prev, index) {
  return prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
}

function CheckableListItem({ checked, onToggle, children }) {
  return (
    <li
      className={[
        "single-view__list-item",
        "single-view__list-item--with-checkbox",
        checked && "single-view__list-item--checked",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="single-view__checkbox-wrap" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onChange={onToggle} className="single-view__checkbox" />
      </span>
      {children}
    </li>
  );
}

function TagsSection({ tags, className = "" }) {
  if (!tags?.length) return null;
  return (
    <section className={`single-view__meta ${className}`}>
      <div className="single-view__meta-block">
        {/* <h2 className="single-view__subtitle">{messages.recipe_form_tags}</h2> */}
        <div className="single-view__tags">
          {tags.map((tag) => (
            <span key={tag} className="single-view__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SingleView() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const {
    data: recipe,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId),
    initialData: state.item,
    enabled: !!recipeId
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: getRecipes,
    enabled: !!(recipe && recipe.pairings && recipe.pairings.length > 0)
  });

  const pairingIdToName = recipes.length
    ? Object.fromEntries(recipes.map((r) => [r.id, r.name]))
    : {};

  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [checkedDirections, setCheckedDirections] = useState([]);

  const toggleIngredient = useCallback(
    (index) => setCheckedIngredients((prev) => toggleIndex(prev, index)),
    []
  );
  const toggleDirection = useCallback(
    (index) => setCheckedDirections((prev) => toggleIndex(prev, index)),
    []
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipeId]);

  if (isError) {
    console.error("Unable to fetch recipe with id", error);
  }

  if (isLoading || !recipe) {
    return null;
  }

  const renderIngredients = () =>
    recipe.ingredients.map((ingredient, i) => {
      const checked = checkedIngredients.includes(i);
      return (
        <CheckableListItem key={i} checked={checked} onToggle={() => toggleIngredient(i)}>
          <span className="single-view__list-item-content">
            <span className="single-view__amount">
              {ingredient.amount.value !== "0" ? ingredient.amount.value : null}{" "}
              {messages[`unit_${ingredient.amount.unit}`]}
            </span>
            <span
              className={[
                "single-view__ingredient-name",
                checked && "single-view__ingredient-name--checked",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {ingredient.name.toLowerCase()}
            </span>
          </span>
        </CheckableListItem>
      );
    });

  return (
    <div className="single-view">
      <div className="single-view__container single-view__header-block">
        <Header>
          <Button
            shape="circle"
            icon={<EditOutlined />}
            size="large"
            onClick={() => navigate(`/dashboard/${recipeId}`)}
          />
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
            {recipe.pairings?.length > 0 && (
              <ul className="single-view__pairings single-view__pairings--under-description">
                {recipe.pairings.map((id) => (
                  <li key={id} className="single-view__pairing">
                    <Link to={`/recipe/${id}`} className="single-view__pairing-link">
                      {pairingIdToName[id] ?? id}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <TagsSection tags={recipe.tags} className="single-view__meta--mobile" />
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
                    <CheckableListItem key={i} checked={checked} onToggle={() => toggleDirection(i)}>
                      <span className="single-view__step-num">{i + 1}.</span>
                      <span className="single-view__list-item-content">{direction.text}</span>
                    </CheckableListItem>
                  );
                })}
              </ol>
            </section>
          </div>
          <aside className="single-view__sidebar">
            <TagsSection tags={recipe.tags} className="single-view__meta--desktop" />
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
