import { OperationMethod } from "@openapi-io-ts/core";
import * as O from "fp-ts/Option";
import { ParsedBody } from "../body";
import { ParsedParameter } from "../parameter";
import { ParsedItem } from "../parsedItem";
import { ParsedResponse } from "../response";

export type ParsedOperation = {
  path: string;
  method: OperationMethod;
  parameters: ParsedItem<ParsedParameter>[];
  body: O.Option<ParsedItem<ParsedBody>>;
  responses: Record<string, ParsedItem<ParsedResponse>>;
};
