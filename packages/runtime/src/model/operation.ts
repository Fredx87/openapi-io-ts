import { OperationMethod } from "@openapi-io-ts/core";
import { OperationBody } from "./body";
import { OperationParameter } from "./parameters";
import { OperationResponses } from "./responses";

export type OperationResponseType = "empty" | "string" | "blob";

export interface Operation {
  readonly path: string;
  readonly method: OperationMethod;
  readonly requestDefaultHeaders: Record<string, string>;
  readonly parameters: readonly OperationParameter[];
  readonly responses: OperationResponses;
  readonly body?: OperationBody;
}
