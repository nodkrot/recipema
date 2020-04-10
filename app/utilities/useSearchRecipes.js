import { useState } from "react";

export default function useSearchRecipes(initRecipes) {
  const [recipes, setRecipes] = useState(initRecipes);
  const [results, setResults] = useState(initRecipes);
  let searchTimeout = null;

  function setSearchRecipes(newRecipes) {
    setRecipes(newRecipes);
    setResults(newRecipes);
  }

  function handleSearch(e) {
    const value = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const newResults = recipes.filter(
        ({ name, description }) =>
          name.toLowerCase().includes(value) || description.toLowerCase().includes(value)
      );

      setResults(newResults);
    }, 200);
  }

  return [results, handleSearch, setSearchRecipes];
}
