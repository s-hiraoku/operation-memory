import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { OperationRecipe } from "../src/recipe.js";
import { addRecipe, FileSystemRecipeStore, listRecipes, resolveRecipesDir, showRecipe } from "../src/store.js";
import { searchRecipeList, searchRecipes } from "../src/search.js";

function recipe(overrides: Partial<OperationRecipe> = {}): OperationRecipe {
  return {
    id: "deploy-check",
    name: "Deploy Check",
    description: "Verify deployment health",
    scope: {
      kind: "cli",
      project: "operation-memory",
      command: "kubectl",
    },
    intent: { description: "Catch deployment regressions" },
    risk: "read",
    inputs: [],
    steps: [{ description: "Check service status" }],
    success_conditions: ["The deployment is healthy."],
    failure_patterns: [{ pattern: "health endpoint down", meaning: "Health endpoint is down" }],
    policy: { allowed_modes: [] },
    metadata: {
      created_at: "2026-05-05T00:00:00.000Z",
      updated_at: "2026-05-05T00:00:00.000Z",
      confidence: "medium",
    },
    ...overrides,
  };
}

describe("filesystem recipe store", () => {
  it("prefers .operation-memory/recipes when it exists", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "operation-memory-cwd-"));
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-home-"));
    const localRecipesDir = path.join(cwd, ".operation-memory", "recipes");
    await mkdir(localRecipesDir, { recursive: true });

    expect(resolveRecipesDir({ cwd, homeDir })).toBe(localRecipesDir);
  });

  it("falls back to ~/.operation-memory/recipes", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "operation-memory-cwd-"));
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-home-"));

    expect(resolveRecipesDir({ cwd, homeDir })).toBe(path.join(homeDir, ".operation-memory", "recipes"));
  });

  it("adds, lists, and shows YAML recipes", async () => {
    const recipesDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-recipes-"));

    await addRecipe(recipe(), { recipesDir });

    await expect(listRecipes({ recipesDir })).resolves.toEqual([
      expect.objectContaining({ id: "deploy-check", name: "Deploy Check" }),
    ]);
    await expect(showRecipe("deploy-check", { recipesDir })).resolves.toEqual(
      expect.objectContaining({ description: "Verify deployment health" }),
    );

    const yaml = await readFile(path.join(recipesDir, "deploy-check.yml"), "utf8");
    expect(yaml).toContain("id: deploy-check");
    expect(yaml).toContain("steps:");
  });

  it("supports the FileSystemRecipeStore add/list/show API", async () => {
    const recipesDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-class-"));
    const sourceDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-source-"));
    await addRecipe(recipe({ id: "source-recipe", name: "Source Recipe" }), { recipesDir: sourceDir });

    const store = new FileSystemRecipeStore({ recipesDir });
    await expect(store.add(path.join(sourceDir, "source-recipe.yml"))).resolves.toMatchObject({ id: "source-recipe" });
    await expect(store.list()).resolves.toHaveLength(1);
    await expect(store.show("source-recipe")).resolves.toMatchObject({ name: "Source Recipe" });
    await expect(readFile(path.join(sourceDir, "source-recipe.yml"), "utf8")).resolves.toContain("id: source-recipe");
  });
});

describe("recipe search", () => {
  it("scores id, name, description, scope, intent, steps, and failure meanings", () => {
    const results = searchRecipeList(
      [
        recipe({
          id: "api-timeout",
          name: "API Timeout",
          description: "Investigate elevated latency",
          scope: { kind: "cloud", project: "api-runtime", command: "kubectl" },
          intent: { description: "Restore API reliability" },
          steps: [{ description: "Inspect upstream timeout logs" }],
          failure_patterns: [
            { pattern: "gateway timeout", meaning: "Gateway timeout from upstream service" },
          ],
        }),
        recipe({
          id: "billing-note",
          name: "Billing Note",
          description: "Update billing annotations",
          scope: { kind: "saas", project: "finance" },
        }),
      ],
      "upstream timeout",
    );

    expect(results).toHaveLength(1);
    expect(results[0].recipe.id).toBe("api-timeout");
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matches).toEqual(expect.arrayContaining(["steps.description", "failure_patterns.meaning"]));
  });

  it("searches recipes from the filesystem store", async () => {
    const recipesDir = await mkdtemp(path.join(os.tmpdir(), "operation-memory-search-"));
    await addRecipe(
      recipe({
        id: "incident-review",
        name: "Incident Review",
        description: "Summarize customer impact",
        scope: { kind: "saas", project: "support" },
      }),
      { recipesDir },
    );

    const results = await searchRecipes("customer", { recipesDir });

    expect(results[0].recipe.id).toBe("incident-review");
  });
});
