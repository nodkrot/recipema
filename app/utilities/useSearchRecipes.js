import { useState } from "react";
import Fuse from "fuse.js";

const options = {
  threshold: 0.3,
  keys: [
    {
      name: "name",
      weight: 0.9
    },
    {
      name: "description",
      weight: 0.6
    },
    {
      name: "ingredients.name",
      weight: 0.3
    },
    {
      name: "directions.text",
      weight: 0.3
    }
  ]
};

export default function useSearchRecipes(initRecipes) {
  const [recipes, setRecipes] = useState(initRecipes);
  const [results, setResults] = useState(initRecipes);
  const fuse = new Fuse(recipes, options);
  let searchTimeout = null;

  function setSearchRecipes(newRecipes) {
    setRecipes(newRecipes);
    setResults(newRecipes);
  }

  function handleSearch(e) {
    const value = e.target.value.trim();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      if (value.length) {
        setResults(fuse.search(value).map(({ item }) => item));
      } else {
        setResults(recipes);
      }
    }, 200);
  }

  return [results, handleSearch, setSearchRecipes];
}
