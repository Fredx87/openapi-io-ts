import { OperationParameterIn } from "@openapi-io-ts/core";

export interface BaseParameter {
  in: OperationParameterIn;
  name: string;
}

export interface JsonParameter extends BaseParameter {
  _tag: "JsonParameter";
}

export interface FormParameter extends BaseParameter {
  _tag: "FormParameter";
  explode: boolean;
}

export type OperationParameter = JsonParameter | FormParameter;
