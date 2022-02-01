import { ParsedComponents } from "./components";
import { ParsedOperation } from "./operation";
import { ParsedItem, ReferencedParsedItems } from "./parsedItem";
import { ParsedServer } from "./server";

export interface ParserOutput {
  referencedParsedItems: ReferencedParsedItems;
  operations: Record<string, ParsedOperation>;
  tags: Record<string, string[]>;
  servers: ParsedServer[];
}

export function parserOutput(): ParserOutput {
  return {
    referencedParsedItems: {
      parameters: {},
      responses: {},
      requestBodies: {},
    },
    operations: {},
    tags: {},
    servers: [],
  };
}
