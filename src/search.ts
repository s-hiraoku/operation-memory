import type { OperationRecipe } from "./recipe.js";
import type { StoreOptions } from "./store.js";

export interface SearchResult {
  recipe: OperationRecipe;
  score: number;
  matches: string[];
}

function compact(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}

export function searchableFields(recipe: OperationRecipe): Record<string, string> {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    scope: compact([
      recipe.scope.kind,
      recipe.scope.domain,
      recipe.scope.project,
      recipe.scope.command,
      recipe.scope.tool,
    ]).join(" "),
    "intent.description": recipe.intent.description,
    "steps.description": recipe.steps.map((step) => step.description).join(" "),
    "failure_patterns.meaning": recipe.failure_patterns.map((failure) => failure.meaning).join(" "),
  };
}

export function scoreRecipe(recipe: OperationRecipe, query: string): SearchResult | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const fields = searchableFields(recipe);
  let score = 0;
  const matches = new Set<string>();

  for (const [field, value] of Object.entries(fields)) {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue.includes(normalizedQuery)) {
      score += field === "id" || field === "name" ? 10 : 5;
      matches.add(field);
    }
    for (const term of terms) {
      if (normalizedValue.includes(term)) {
        score += field === "id" || field === "name" ? 5 : 2;
        matches.add(field);
      }
    }
  }

  if (score === 0) return null;
  return { recipe, score, matches: [...matches] };
}

export function searchRecipes(recipes: OperationRecipe[], query: string): SearchResult[];
export function searchRecipes(query: string, options?: StoreOptions): Promise<SearchResult[]>;
export function searchRecipes(
  recipesOrQuery: OperationRecipe[] | string,
  queryOrOptions: string | StoreOptions = {},
): SearchResult[] | Promise<SearchResult[]> {
  if (typeof recipesOrQuery === "string") {
    const query = recipesOrQuery;
    const options = typeof queryOrOptions === "string" ? {} : queryOrOptions;
    return import("./store.js").then(({ listRecipes }) => listRecipes(options).then((recipes) => searchRecipeList(recipes, query)));
  }

  const recipes = recipesOrQuery;
  const query = typeof queryOrOptions === "string" ? queryOrOptions : "";
  return recipes
    .map((recipe) => scoreRecipe(recipe, query))
    .filter((result): result is SearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.recipe.id.localeCompare(b.recipe.id));
}

export function searchRecipeList(recipes: OperationRecipe[], query: string): SearchResult[] {
  return searchRecipes(recipes, query);
}
