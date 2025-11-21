import type { ComponentType } from "react";
import { FloatPrecisionDemo } from "./float-precision-demo";
import { ReactKeyIndexDemo } from "./react-key-index-demo";

// Map of topic IDs to their corresponding animation components
export const animationRegistry: Record<string, ComponentType> = {
  "float-precision": FloatPrecisionDemo,
  "react-key-index-problem": ReactKeyIndexDemo,
};

export function getAnimationComponent(topicId: string): ComponentType | null {
  return animationRegistry[topicId] || null;
}
