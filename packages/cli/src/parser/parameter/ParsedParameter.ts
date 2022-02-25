import { OperationParameterIn } from "@openapi-io-ts/core";
import { ParsedItemSchema } from "../parsedItem";

export interface ParsedBaseParameter {
  in: OperationParameterIn;
  name: string;
  schema: ParsedItemSchema;
  required: boolean;
  defaultValue?: unknown;
}

export interface ParsedJsonParameter extends ParsedBaseParameter {
  _tag: "ParsedJsonParameter";
}

export interface ParsedFormParameter extends ParsedBaseParameter {
  _tag: "ParsedFormParameter";
  explode: boolean;
}

export type ParsedParameter = ParsedJsonParameter | ParsedFormParameter;
