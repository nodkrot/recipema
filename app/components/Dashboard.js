import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import uniqueId from "lodash/uniqueId";
import differenceWith from "lodash/differenceWith";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import message from "antd/lib/message";
import imageCompression from "browser-image-compression";
import Header from "./Header.js";
import Footer from "./Footer.js";
import RecipeForm from "./RecipeForm.js";
import RecipeList from "./RecipeList.js";
import {
  auth,
  createImage,
  deleteImage,
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
} from "../utilities/firebase.js";
import { Context } from "../utilities/store.js";
import history from "../utilities/history.js";
import Messages from "../messages.json";
import "./Dashboard.css";

const messages = Messages["ru_RU"];

function extractRawIngredients(recipes) {
  const set = new Set();
  recipes.forEach((recipe) => recipe.ingredients.forEach((a) => set.add(a.name)));

  return [...set];
}

async function compressImage(image) {
  const imageFile = image.originFileObj;
  const compressedFile = await imageCompression(imageFile, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  });

  return { ...image, originFileObj: compressedFile };
}

export default function Dashboard({ match }) {
  const [, dispatch] = useContext(Context);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [newRecipeId, setNewRecipeId] = useState(uniqueId());
  const [recipes, setRecipes] = useState([]);
  const [rawIngredients, setRawIngredients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (match.params.recipeId) {
      getRecipeById(match.params.recipeId)
        .then((fetchedRecipe) => setCurrentRecipe(fetchedRecipe))
        .catch((err) => console.log("Unable to fetch recipe with id", err));
    } else {
      setCurrentRecipe(null);
    }

    scrollTo(0, 0);
  }, [match.params.recipeId]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    setIsFetching(true);

    try {
      const recipes = await getRecipes();

      setRecipes(recipes);
      setRawIngredients(extractRawIngredients(recipes));
    } catch (err) {
      message.error(messages.notification_failure);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(recipeForm) {
    setIsSaving(true);

    const originalImages = currentRecipe ? currentRecipe.gallery : [];
    const newImages = recipeForm.gallery.filter((image) => !!image.originFileObj);
    const oldImages = recipeForm.gallery.filter((image) => !image.originFileObj);
    const deletedImages = differenceWith(originalImages, oldImages, (a, b) => a.uid === b.uid);

    try {
      const compressedNewImages = await Promise.all(newImages.map(compressImage));
      const savedGallery = await Promise.all([
        ...oldImages,
        ...compressedNewImages.map(createImage),
        ...deletedImages.map(deleteImage)
      ]);

      // Cleanup deleted images that come as `undefined`
      const finalGallery = savedGallery.filter(Boolean);
      // Update `recipeForm` with new gallery since it was uploaded
      const finalRecipeForm = Object.assign({}, recipeForm, {
        gallery: finalGallery
      });

      let recipe = null;
      let updatedRecipes = null;

      if (currentRecipe) {
        recipe = await updateRecipe(currentRecipe.id, finalRecipeForm);
        updatedRecipes = recipes.map((item) => (item.id === recipe.id ? recipe : item));
        message.success(messages.notification_successfully_updated);
      } else {
        recipe = await createRecipe(finalRecipeForm);
        updatedRecipes = [recipe, ...recipes];
        message.success(messages.notification_successfully_created);
      }

      goToDashboard(recipe.id);
      setCurrentRecipe(recipe);
      setRecipes(updatedRecipes);
    } catch (err) {
      message.error(messages.notification_failure);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await auth.signOut();
      dispatch({ type: "UNSET_USER" });
    } catch (err) {
      message.error(message.notification_failure);
    }
  }

  async function handleRemove(recipe) {
    try {
      await Promise.all((recipe.gallery || []).map(deleteImage).concat(deleteRecipe(recipe.id)));
      const updatedRecipes = recipes.filter((item) => item.id !== recipe.id);

      goToDashboard();
      setRecipes(updatedRecipes);
      message.success(messages.notification_successfully_deleted);
    } catch (err) {
      message.error(message.notification_failure);
    }
  }

  function handleEdit(recipe) {
    goToDashboard(recipe.id);
  }

  function handleNew() {
    Modal.confirm({
      title: messages.modal_new_recipe_title,
      onOk: () => {
        goToDashboard();
        setNewRecipeId(uniqueId());
      }
    });
  }

  function goToDashboard(id) {
    if (!id) {
      history.push("/dashboard");
    } else {
      history.push(`/dashboard/${id}`);
    }
  }

  function handlePreview(recipe) {
    history.push(`/recipe/${recipe.id}`);
  }

  function handleHome() {
    history.push("/");
  }

  return (
    <div className="dashboard">
      <Header path="/dashboard">
        <Button shape="circle" icon="home" size="large" onClick={handleHome} />{" "}
        <Button shape="circle" icon="logout" size="large" onClick={handleSignOut} />
      </Header>
      <div className="dashboard__content">
        <Row type="flex" justify="center" gutter={16}>
          <Col xs={24} sm={14}>
            <RecipeForm
              key={currentRecipe ? currentRecipe.id : newRecipeId}
              recipe={currentRecipe}
              recipes={recipes}
              ingredientList={rawIngredients}
              onSubmit={handleSubmit}
              onPreview={handlePreview}
              isLoading={isSaving}
            />
          </Col>
          <Col xs={24} sm={10}>
            <h1 className="dashboard__title">
              {messages.app_list_title}
              <Button type="primary" shape="circle" icon="plus" size="large" onClick={handleNew} />
            </h1>
            <RecipeList
              recipes={recipes}
              isLoading={isFetching}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          </Col>
        </Row>
      </div>
      <Footer />
    </div>
  );
}

Dashboard.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      recipeId: PropTypes.string
    })
  })
};
