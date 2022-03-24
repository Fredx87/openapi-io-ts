import { OperationMethod } from "@openapi-io-ts/core";
import * as O from "fp-ts/Option";
import { ParsedItem } from "../parsedItem";

export type ParsedOperation = {
  path: string;
  method: OperationMethod;
  parameters: ParsedItem<"parameter">[];
  body: O.Option<ParsedItem<"body">>;
  responses: Record<string, ParsedItem<"response">>;
};
