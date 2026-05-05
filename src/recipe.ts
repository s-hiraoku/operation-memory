import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { z } from "zod";

export const scopeKindSchema = z.enum([
  "web",
  "cli",
  "git",
  "ide",
  "mcp",
  "cloud",
  "saas",
  "other",
]);

export const riskSchema = z.enum([
  "read",
  "draft",
  "prefill",
  "write",
  "destructive",
  "real_world",
]);

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const scopeSchema = z
  .object({
    kind: scopeKindSchema,
    domain: z.string().min(1).optional(),
    project: z.string().min(1).optional(),
    command: z.string().min(1).optional(),
    tool: z.string().min(1).optional(),
  })
  .strict();

export const inputSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    required: z.boolean().default(false),
    example: z.unknown().optional(),
  })
  .strict();

export const stepSchema = z
  .object({
    description: z.string().min(1),
    action: z.string().min(1).optional(),
    expected_result: z.string().min(1).optional(),
    requires_confirmation: z.boolean().optional(),
  })
  .strict();

export const failurePatternSchema = z
  .object({
    pattern: z.string().min(1),
    meaning: z.string().min(1),
    recovery: z.string().min(1).optional(),
  })
  .strict();

export const policySchema = z
  .object({
    requires_confirmation: z.boolean().optional(),
    allowed_modes: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const metadataSchema = z
  .object({
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    last_verified_at: z.string().datetime({ offset: true }).optional(),
    success_rate: z.number().min(0).max(1).optional(),
    confidence: confidenceSchema,
  })
  .strict();

export const operationRecipeSchema = z
  .object({
    id: z.string().min(1).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
    name: z.string().min(1),
    description: z.string().min(1),
    scope: scopeSchema,
    intent: z
      .object({
        description: z.string().min(1),
      })
      .strict(),
    risk: riskSchema,
    inputs: z.array(inputSchema).default([]),
    steps: z.array(stepSchema).min(1),
    success_conditions: z.array(z.string().min(1)).default([]),
    failure_patterns: z.array(failurePatternSchema).default([]),
    policy: policySchema.default({ allowed_modes: [] }),
    metadata: metadataSchema,
  })
  .strict();

export type OperationRecipe = z.infer<typeof operationRecipeSchema>;
export type OperationRisk = z.infer<typeof riskSchema>;

export function validateRecipe(value: unknown): OperationRecipe {
  return operationRecipeSchema.parse(value);
}

export function safeValidateRecipe(value: unknown) {
  return operationRecipeSchema.safeParse(value);
}

export function parseRecipeYaml(content: string): OperationRecipe {
  return validateRecipe(parse(content));
}

export async function readRecipeFile(filePath: string): Promise<OperationRecipe> {
  return parseRecipeYaml(await readFile(filePath, "utf8"));
}

export function recipeToYaml(recipe: OperationRecipe): string {
  return stringify(validateRecipe(recipe), {
    lineWidth: 100,
    minContentWidth: 20,
  });
}
