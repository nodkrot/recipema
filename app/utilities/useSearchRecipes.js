import { useState, useRef } from "react";
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
  const searchQueryRef = useRef("");
  const searchTimeoutRef = useRef(null);

  function setSearchRecipes(newRecipes) {
    setRecipes(newRecipes);
    const query = searchQueryRef.current;
    if (query) {
      setResults(new Fuse(newRecipes, options).search(query).map(({ item }) => item));
    } else {
      setResults(newRecipes);
    }
  }

  function handleSearch(e) {
    const value = e.target.value.trim();
    searchQueryRef.current = value;

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length) {
        setResults(new Fuse(recipes, options).search(value).map(({ item }) => item));
      } else {
        setResults(recipes);
      }
    }, 200);
  }

  return [results, handleSearch, setSearchRecipes];
}
