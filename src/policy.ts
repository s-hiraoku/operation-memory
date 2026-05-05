import type { OperationRecipe, OperationRisk } from "./recipe.js";

export type ConfirmationRequirement = "none" | "optional" | "before_submit" | "required";

export function confirmationRequirementForRisk(risk: OperationRisk): ConfirmationRequirement {
  switch (risk) {
    case "read":
      return "none";
    case "draft":
      return "optional";
    case "prefill":
      return "before_submit";
    case "write":
    case "destructive":
    case "real_world":
      return "required";
    default: {
      const exhaustive: never = risk;
      throw new Error(`Unsupported risk: ${exhaustive}`);
    }
  }
}

export function requiresConfirmationForRisk(risk: OperationRisk): boolean {
  const requirement = confirmationRequirementForRisk(risk);
  return requirement === "before_submit" || requirement === "required";
}

export function requiresConfirmation(recipe: OperationRecipe): boolean {
  if (requiresConfirmationForRisk(recipe.risk)) {
    return true;
  }
  if (typeof recipe.policy.requires_confirmation === "boolean") {
    return recipe.policy.requires_confirmation;
  }
  return requiresConfirmationForRisk(recipe.risk);
}
