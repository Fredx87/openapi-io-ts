import { OperationParameterIn } from "../../common/operation";

export interface BaseParameter {
  in: OperationParameterIn;
  name: string;
}

export interface JsonStyleParameter extends BaseParameter {
  style: "json";
}

export interface FormStyleParameter extends BaseParameter {
  style: "form";
  explode: boolean;
}

export type OperationParameter = JsonStyleParameter | FormStyleParameter;
