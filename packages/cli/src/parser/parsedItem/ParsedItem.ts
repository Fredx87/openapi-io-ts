import * as O from "fp-ts/Option";
import { ModelGenerationInfo } from "json-schema-io-ts";
import { ParsedBody } from "../body";
import { ParsedOperation } from "../operation";
import { ParsedParameter } from "../parameter";
import { ParsedResponse } from "../response";

export type ParsedItemType =
  | ParsedBody
  | ParsedParameter
  | ParsedResponse
  | ParsedOperation;

export interface ParsedItem<T extends ParsedItemType> {
  item: T;
  modelGenerationInfo: O.Option<ModelGenerationInfo>;
}

export function parsedItem<T extends ParsedItemType>(
  item: T,
  modelGenerationInfo: O.Option<ModelGenerationInfo>
): ParsedItem<T> {
  return {
    item,
    modelGenerationInfo,
  };
}
