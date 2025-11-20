import type { ComponentType } from "react";
import { FloatPrecisionDemo } from "./float-precision-demo";

// Map of topic IDs to their corresponding animation components
export const animationRegistry: Record<string, ComponentType> = {
  "float-precision": FloatPrecisionDemo,
};

export function getAnimationComponent(topicId: string): ComponentType | null {
  return animationRegistry[topicId] || null;
}
