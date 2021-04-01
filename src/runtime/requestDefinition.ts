import { ParametersDefinitions } from "./parameter";
import { JsonResponse, TextResponse } from "./response";

export type BodyType = "json" | "text";

export interface RequestDefinition<ReturnType> {
  path: string;
  method: "get" | "post" | "put" | "delete";
  parametersDefinitions: ParametersDefinitions;
  successfulResponse?: TextResponse | JsonResponse<ReturnType>;
  bodyType?: BodyType;
}
