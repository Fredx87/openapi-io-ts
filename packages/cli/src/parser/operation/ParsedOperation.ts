import { OperationMethod } from "@openapi-io-ts/core";
import * as O from "fp-ts/Option";
import { ParsedBody } from "../body";
import { ParsedParameter } from "../parameter";
import { ParsedResponse } from "../response";

export type ParsedOperation = {
  path: string;
  method: OperationMethod;
  parameters: (string | ParsedParameter)[];
  body: O.Option<string | ParsedBody>;
  responses: Record<string, string | ParsedResponse>;
};
