import { statSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { type OperationRecipe, readRecipeFile, recipeToYaml, validateRecipe } from "./recipe.js";
import { searchRecipes, type SearchResult } from "./search.js";

export class RecipeNotFoundError extends Error {
  constructor(id: string) {
    super(`Recipe not found: ${id}`);
    this.name = "RecipeNotFoundError";
  }
}

export interface StoreOptions {
  cwd?: string;
  homeDir?: string;
  recipesDir?: string;
}

export function resolveRecipesDir(options?: StoreOptions): string;
export function resolveRecipesDir(cwd?: string, homeDir?: string): string;
export function resolveRecipesDir(
  cwdOrOptions: string | StoreOptions = process.cwd(),
  explicitHomeDir = homedir(),
): string {
  if (typeof cwdOrOptions === "object") {
    if (cwdOrOptions.recipesDir) return path.resolve(cwdOrOptions.recipesDir);
    const cwd = cwdOrOptions.cwd ?? process.cwd();
    const homeDir = cwdOrOptions.homeDir ?? homedir();
    return resolveRecipesDir(cwd, homeDir);
  }
  const cwd = cwdOrOptions;
  const homeDir = explicitHomeDir;
  const localDir = path.join(cwd, ".operation-memory", "recipes");
  if (directoryExists(localDir)) {
    return localDir;
  }
  return path.join(homeDir, ".operation-memory", "recipes");
}

function directoryExists(target: string): boolean {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

export async function loadYamlFile(filePath: string): Promise<unknown> {
  return parse(await readFile(filePath, "utf8"));
}

export async function validateRecipeFile(filePath: string): Promise<OperationRecipe> {
  return validateRecipe(await loadYamlFile(filePath));
}

export class FileSystemRecipeStore {
  readonly cwd: string;
  readonly homeDir: string;
  readonly recipesDir: string;

  constructor(options: StoreOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.homeDir = options.homeDir ?? homedir();
    this.recipesDir = resolveRecipesDir(options);
  }

  async init(): Promise<string> {
    const localDir = path.join(this.cwd, ".operation-memory", "recipes");
    await mkdir(localDir, { recursive: true });
    return localDir;
  }

  async add(recipeFile: string): Promise<OperationRecipe> {
    const recipe = await readRecipeFile(recipeFile);
    await mkdir(this.recipesDir, { recursive: true });
    await writeFile(path.join(this.recipesDir, `${recipe.id}.yml`), recipeToYaml(recipe), "utf8");
    return recipe;
  }

  async list(): Promise<OperationRecipe[]> {
    await mkdir(this.recipesDir, { recursive: true });
    const entries = await readdir(this.recipesDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => path.join(this.recipesDir, entry.name))
      .sort();
    const recipes = await Promise.all(files.map((file) => readRecipeFile(file)));
    return recipes.sort((a, b) => a.id.localeCompare(b.id));
  }

  async show(id: string): Promise<OperationRecipe> {
    const recipe = (await this.list()).find((candidate) => candidate.id === id);
    if (!recipe) throw new RecipeNotFoundError(id);
    return recipe;
  }

  async search(query: string): Promise<SearchResult[]> {
    return searchRecipes(await this.list(), query);
  }
}

export async function addRecipe(recipe: OperationRecipe, options: StoreOptions = {}): Promise<OperationRecipe> {
  const validRecipe = validateRecipe(recipe);
  const recipesDir = resolveRecipesDir(options);
  await mkdir(recipesDir, { recursive: true });
  await writeFile(path.join(recipesDir, `${validRecipe.id}.yml`), recipeToYaml(validRecipe), "utf8");
  return validRecipe;
}

export async function listRecipes(options: StoreOptions = {}): Promise<OperationRecipe[]> {
  return new FileSystemRecipeStore(options).list();
}

export async function showRecipe(id: string, options: StoreOptions = {}): Promise<OperationRecipe | undefined> {
  try {
    return await new FileSystemRecipeStore(options).show(id);
  } catch (error) {
    if (error instanceof RecipeNotFoundError) return undefined;
    throw error;
  }
}
