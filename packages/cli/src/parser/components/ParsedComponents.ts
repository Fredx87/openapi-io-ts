import { ParsedBody } from "../body";
import { ParsedParameter } from "../parameters";
import { ParsedItem } from "../ParsedItem";
import { ParsedResponse } from "../response";

export interface ParsedComponents {
  parameters: Record<string, ParsedItem<ParsedParameter>>;
  responses: Record<string, ParsedItem<ParsedResponse>>;
  requestBodies: Record<string, ParsedItem<ParsedBody>>;
}

export type ComponentType = keyof ParsedComponents;

export interface ComponentReference<T extends ComponentType> {
  type: "ComponentReference";
  componentType: T;
  pointer: string;
}

export function componentReference<T extends ComponentType>(
  componentType: T,
  pointer: string
): ComponentReference<T> {
  return {
    type: "ComponentReference",
    componentType,
    pointer,
  };
}
