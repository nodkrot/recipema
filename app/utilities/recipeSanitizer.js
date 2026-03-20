const trimText = (value) => (typeof value === "string" ? value.trim() : "");

function normalizeIngredient(ingredient) {
  if (!ingredient) return null;

  const name = trimText(ingredient.name);
  const value = ingredient.amount?.value == null ? "" : String(ingredient.amount.value).trim();
  const unit = trimText(ingredient.amount?.unit);
  if (!name && !value && !unit) return null;

  return {
    ...(name ? { name } : {}),
    ...(value || unit ? { amount: { ...(value ? { value } : {}), ...(unit ? { unit } : {}) } } : {})
  };
}

const normalizeDirection = (direction) => {
  const text = trimText(direction?.text);
  return text ? { text } : null;
};

export function sanitizeRecipe(recipe = {}) {
  return {
    ...recipe,
    ingredients: (recipe.ingredients || []).map(normalizeIngredient).filter(Boolean),
    directions: (recipe.directions || []).map(normalizeDirection).filter(Boolean)
  };
}
