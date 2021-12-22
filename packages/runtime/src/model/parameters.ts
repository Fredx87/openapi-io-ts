import { OperationParameterIn } from "@openapi-io-ts/core";
import { Decoder } from "io-ts";

export interface BaseParameter {
  in: OperationParameterIn;
  name: string;
}

export interface JsonParameter extends BaseParameter {
  _tag: "JsonParameter";
  decoder: Decoder<unknown, unknown>;
}

export interface FormParameter extends BaseParameter {
  _tag: "FormParameter";
  explode: boolean;
}

export type OperationParameter = JsonParameter | FormParameter;
