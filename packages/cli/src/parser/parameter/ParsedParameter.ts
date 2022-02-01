import { OperationParameterIn } from "@openapi-io-ts/core";
import * as gen from "io-ts-codegen";

export interface ParsedBaseParameter {
  in: OperationParameterIn;
  name: string;
  type: gen.TypeDeclaration | gen.TypeReference;
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
