import { OperationMethod } from "@openapi-io-ts/core";
import { OperationBody } from "./body";
import { OperationParameter } from "./parameters";
import { OperationResponses } from "./responses";

export type OperationResponseType = "empty" | "string" | "blob";

export interface Operation {
  path: string;
  method: OperationMethod;
  requestDefaultHeaders: Record<string, string>;
  parameters: OperationParameter[];
  responses: OperationResponses;
  body?: OperationBody;
}
