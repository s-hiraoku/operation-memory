import { describe, expect, it } from "vitest";
import {
  confirmationRequirementForRisk,
  requiresConfirmation,
  requiresConfirmationForRisk,
} from "../src/policy.js";
import { operationRecipeSchema, validateRecipe } from "../src/recipe.js";

const validRecipe = {
  id: "restart-api",
  name: "Restart API service",
  description: "Restart the API service after a safe deploy.",
  scope: {
    kind: "cli",
    project: "operation-memory",
    command: "systemctl",
  },
  intent: {
    description: "Recover the API service when it is wedged after deploy.",
  },
  risk: "write",
  inputs: [{ name: "service", required: true, example: "api" }],
  steps: [
    {
      description: "Restart the service.",
      action: "systemctl restart api",
      expected_result: "The service is active.",
    },
  ],
  success_conditions: ["Service health check passes."],
  failure_patterns: [
    {
      pattern: "service fails to start",
      meaning: "The unit or its dependencies are unhealthy.",
      recovery: "Inspect journalctl output.",
    },
  ],
  metadata: {
    created_at: "2026-05-05T00:00:00.000Z",
    updated_at: "2026-05-05T00:00:00.000Z",
    confidence: "medium",
  },
};

describe("operationRecipeSchema", () => {
  it("parses an operation recipe and applies defaults", () => {
    const recipe = validateRecipe(validRecipe);

    expect(recipe).toMatchObject(validRecipe);
    expect(recipe.policy).toEqual({ allowed_modes: [] });
  });

  it("rejects invalid recipe ids", () => {
    const result = operationRecipeSchema.safeParse({
      ...validRecipe,
      id: "invalid id",
    });

    expect(result.success).toBe(false);
  });

  it("rejects recipes without steps", () => {
    const result = operationRecipeSchema.safeParse({
      ...validRecipe,
      steps: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown risk levels", () => {
    const result = operationRecipeSchema.safeParse({
      ...validRecipe,
      risk: "critical",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown execution modes", () => {
    const result = operationRecipeSchema.safeParse({
      ...validRecipe,
      policy: { allowed_modes: ["local"] },
    });

    expect(result.success).toBe(false);
  });

  it("rejects disabled confirmation for write and higher-impact risks", () => {
    for (const risk of ["write", "destructive", "real_world"] as const) {
      const result = operationRecipeSchema.safeParse({
        ...validRecipe,
        risk,
        policy: { requires_confirmation: false, allowed_modes: ["assisted"] },
      });

      expect(result.success).toBe(false);
    }
  });
});

describe("confirmation policy", () => {
  it("maps risk levels to confirmation requirements", () => {
    expect(confirmationRequirementForRisk("read")).toBe("none");
    expect(confirmationRequirementForRisk("draft")).toBe("optional");
    expect(confirmationRequirementForRisk("prefill")).toBe("before_submit");
    expect(confirmationRequirementForRisk("write")).toBe("required");
    expect(confirmationRequirementForRisk("destructive")).toBe("required");
    expect(confirmationRequirementForRisk("real_world")).toBe("required");
  });

  it("requires confirmation for prefill and higher-impact risks", () => {
    expect(requiresConfirmationForRisk("read")).toBe(false);
    expect(requiresConfirmationForRisk("draft")).toBe(false);
    expect(requiresConfirmationForRisk("prefill")).toBe(true);
    expect(requiresConfirmationForRisk("write")).toBe(true);
  });

  it("allows recipe policy to override risk-derived confirmation", () => {
    expect(requiresConfirmation(validateRecipe({ ...validRecipe, risk: "read" }))).toBe(false);
    expect(
      requiresConfirmation(
        validateRecipe({
          ...validRecipe,
          risk: "read",
          policy: { requires_confirmation: true, allowed_modes: [] },
        }),
      ),
    ).toBe(true);
  });

  it("does not allow high-impact risks to opt out in policy evaluation", () => {
    expect(
      requiresConfirmation({
        ...validateRecipe(validRecipe),
        policy: { requires_confirmation: false, allowed_modes: ["assisted"] },
      }),
    ).toBe(true);
  });
});
