import * as O from "fp-ts/Option";
import { ModelGenerationInfo } from "json-schema-io-ts";
import { ParsedBody } from "../body";
import { ParsedOperation } from "../operation";
import { ParsedParameter } from "../parameter";
import { ParsedResponse } from "../response";

export interface ParsedItemKindTypeMap {
  body: ParsedBody;
  parameter: ParsedParameter;
  response: ParsedResponse;
  operation: ParsedOperation;
}

export type ParsedItemKind = keyof ParsedItemKindTypeMap;

export interface ParsedItem<K extends ParsedItemKind> {
  kind: K;
  item: ParsedItemKindTypeMap[K];
  modelGenerationInfo: O.Option<ModelGenerationInfo>;
}

export function parsedItem<K extends ParsedItemKind>(
  kind: K,
  item: ParsedItemKindTypeMap[K],
  modelGenerationInfo: O.Option<ModelGenerationInfo>
): ParsedItem<K> {
  return {
    kind,
    item,
    modelGenerationInfo,
  };
}
