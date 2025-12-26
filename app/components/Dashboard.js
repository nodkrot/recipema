import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import uniqueId from "lodash/uniqueId";
import differenceWith from "lodash/differenceWith";
import debounce from "lodash/debounce";
import Row from "antd/es/row";
import Col from "antd/es/col";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import message from "antd/es/message";
import { HomeOutlined, LogoutOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import imageCompression from "browser-image-compression";
import { signOut } from "firebase/auth";
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
import Messages from "../messages.json";
import "./Dashboard.css";
import { Flex } from "antd";

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

export default function Dashboard() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [, dispatch] = useContext(Context);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [newRecipeId, setNewRecipeId] = useState(uniqueId());
  const [recipes, setRecipes] = useState([]);
  const [rawIngredients, setRawIngredients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState(null);
  const pendingChangesRef = useRef(null);

  useEffect(() => {
    if (recipeId) {
      getRecipeById(recipeId)
        .then((fetchedRecipe) => setCurrentRecipe(fetchedRecipe))
        .catch((err) => console.log("Unable to fetch recipe with id", err));
    } else {
      setCurrentRecipe(null);
    }

    scrollTo(0, 0);
  }, [recipeId]);

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

  // Auto-save function for existing recipes
  async function performAutoSave(recipeForm, recipeId, currentRecipes) {
    setIsAutoSaving(true);

    try {
      // For auto-save, we don't process new images to avoid excessive uploads
      // We only save the gallery references that already exist
      const existingGallery = recipeForm.gallery.filter((image) => !image.originFileObj);

      const finalRecipeForm = Object.assign({}, recipeForm, {
        gallery: existingGallery
      });

      const recipe = await updateRecipe(recipeId, finalRecipeForm);
      const updatedRecipes = currentRecipes.map((item) => (item.id === recipe.id ? recipe : item));

      setCurrentRecipe(recipe);
      setRecipes(updatedRecipes);
      setLastAutoSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
      // Don't show error message for auto-save failures to avoid interrupting the user
    } finally {
      setIsAutoSaving(false);
    }
  }

  const debouncedAutoSave = useRef(
    debounce((recipeForm, recipeId, currentRecipes) => {
      performAutoSave(recipeForm, recipeId, currentRecipes);
    }, 1000)
  ).current;

  // Handle form changes
  function handleFormChange(recipeForm) {
    // Only auto-save for existing recipes
    if (!currentRecipe) {
      return;
    }

    // Store pending changes
    pendingChangesRef.current = recipeForm;

    // Trigger debounced auto-save with current values
    debouncedAutoSave(recipeForm, currentRecipe.id, recipes);
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      localStorage.removeItem("userId");
      dispatch({ type: "SET_GUEST_USER" });
      navigate("/login");
    } catch (err) {
      message.error(messages.notification_failure);
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
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${id}`);
    }
  }

  function handlePreview() {
    navigate(`/recipe/${currentRecipe.id}`);
  }

  function handleHome() {
    navigate("/");
  }

  return (
    <div className="dashboard">
      <Header path="/dashboard">
        <Flex align="center" justify="end" gap={12}>
          <Button shape="circle" icon={<EyeOutlined />} size="large" onClick={handlePreview} />
          <Button shape="circle" icon={<HomeOutlined />} size="large" onClick={handleHome} />
          <Button shape="circle" icon={<LogoutOutlined />} size="large" onClick={handleSignOut} />
        </Flex>
      </Header>
      <div className="dashboard__content">
        <Row justify="center" gutter={16}>
          <Col xs={24} sm={14}>
            <RecipeForm
              key={currentRecipe ? currentRecipe.id : newRecipeId}
              recipe={currentRecipe}
              recipes={recipes}
              ingredientList={rawIngredients}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              isLoading={isSaving}
              isAutoSaving={isAutoSaving}
              lastAutoSaved={lastAutoSaved}
            />
          </Col>
          <Col xs={24} sm={10}>
            <h1 className="dashboard__title">
              {messages.app_list_title}
              <Button
                type="primary"
                shape="circle"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleNew}
              />
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
