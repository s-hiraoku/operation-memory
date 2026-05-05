#!/usr/bin/env node
import { Command } from "commander";
import { ZodError } from "zod";
import { FileSystemRecipeStore, RecipeNotFoundError, validateRecipeFile } from "./store.js";

interface JsonOption {
  json?: boolean;
}

interface ValidationResult {
  file: string;
  valid: boolean;
  id?: string;
  errors?: string[];
}

function writeJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function writeRecipeSummary(recipe: { id: string; name: string; description?: string; risk?: string }): void {
  console.log(`${recipe.id}: ${recipe.name}`);
  if (recipe.description) console.log(recipe.description);
  if (recipe.risk) console.log(`risk: ${recipe.risk}`);
}

function formatValidationError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
}

function validationErrors(error: ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

async function runAction(action: () => Promise<void>, json = false): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message =
      error instanceof ZodError
        ? formatValidationError(error)
        : error instanceof Error
          ? error.message
          : String(error);
    if (json) {
      writeJson({ ok: false, error: message });
      process.exitCode = 1;
      return;
    }

    if (error instanceof ZodError) {
      console.error(formatValidationError(error));
    } else if (error instanceof RecipeNotFoundError) {
      console.error(error.message);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exitCode = 1;
  }
}

export function createProgram(): Command {
  const program = new Command();
  program.name("opmem").description("Manage local Operation Memory recipes").version("0.1.0").option("--json", "Output JSON");

  const wantsJson = (options: JsonOption) => Boolean(options.json || program.opts<JsonOption>().json);

  program
    .command("init")
    .description("Create .operation-memory/recipes in the current directory")
    .option("--json", "Output JSON")
    .action((options: JsonOption) =>
      runAction(async () => {
        const path = await new FileSystemRecipeStore().init();
        wantsJson(options) ? writeJson({ ok: true, path }) : console.log(`Initialized ${path}`);
      }, wantsJson(options)),
    );

  program
    .command("add")
    .argument("<recipe-file>")
    .description("Validate and add a YAML recipe to the store")
    .option("--json", "Output JSON")
    .action((recipeFile: string, options: JsonOption) =>
      runAction(async () => {
        const recipe = await new FileSystemRecipeStore().add(recipeFile);
        wantsJson(options) ? writeJson(recipe) : writeRecipeSummary(recipe);
      }, wantsJson(options)),
    );

  program
    .command("list")
    .description("List recipes")
    .option("--json", "Output JSON")
    .action((options: JsonOption) =>
      runAction(async () => {
        const recipes = await new FileSystemRecipeStore().list();
        if (wantsJson(options)) {
          writeJson(recipes);
          return;
        }
        for (const recipe of recipes) console.log(`${recipe.id}\t${recipe.name}`);
      }, wantsJson(options)),
    );

  program
    .command("search")
    .argument("<query>")
    .description("Search recipes")
    .option("--json", "Output JSON")
    .action((query: string, options: JsonOption) =>
      runAction(async () => {
        const results = await new FileSystemRecipeStore().search(query);
        if (wantsJson(options)) {
          writeJson(results);
          return;
        }
        for (const result of results) console.log(`${result.recipe.id}\t${result.score}\t${result.recipe.name}`);
      }, wantsJson(options)),
    );

  program
    .command("show")
    .argument("<recipe-id>")
    .description("Show a recipe")
    .option("--json", "Output JSON")
    .action((recipeId: string, options: JsonOption) =>
      runAction(async () => {
        const recipe = await new FileSystemRecipeStore().show(recipeId);
        wantsJson(options) ? writeJson(recipe) : writeRecipeSummary(recipe);
      }, wantsJson(options)),
    );

  program
    .command("validate")
    .argument("[recipe-files...]")
    .description("Validate recipe files, or the stored recipes when no files are passed")
    .option("--json", "Output JSON")
    .action((recipeFiles: string[], options: JsonOption) =>
      runAction(async () => {
        const files = recipeFiles.length > 0 ? recipeFiles : (await new FileSystemRecipeStore().list()).map((recipe) => recipe.id);
        const results: ValidationResult[] = [];

        if (recipeFiles.length === 0) {
          for (const recipe of await new FileSystemRecipeStore().list()) {
            results.push({ file: recipe.id, valid: true, id: recipe.id });
          }
        } else {
          for (const recipeFile of files) {
            try {
              const recipe = await validateRecipeFile(recipeFile);
              results.push({ file: recipeFile, valid: true, id: recipe.id });
            } catch (error) {
              if (error instanceof ZodError) {
                results.push({ file: recipeFile, valid: false, errors: validationErrors(error) });
              } else if (error instanceof Error) {
                results.push({ file: recipeFile, valid: false, errors: [error.message] });
              } else {
                results.push({ file: recipeFile, valid: false, errors: [String(error)] });
              }
            }
          }
        }

        const ok = results.every((result) => result.valid);
        if (wantsJson(options)) {
          writeJson({ ok, results });
        } else {
          for (const result of results) {
            console.log(result.valid ? `valid: ${result.file}` : `invalid: ${result.file}: ${result.errors?.join("; ")}`);
          }
        }
        if (!ok) process.exitCode = 1;
      }, wantsJson(options)),
    );

  return program;
}

createProgram().parseAsync();
