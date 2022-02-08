import { ParsedOperation } from "./operation";
import { ParsedItem, ParsedItemType } from "./parsedItem";
import { ParsedServer } from "./server";

export interface ParserOutput {
  parsedItems: Record<string, ParsedItem<ParsedItemType>>;
  operations: Record<string, ParsedOperation>;
  tags: Record<string, string[]>;
  servers: ParsedServer[];
}

export function parserOutput(): ParserOutput {
  return {
    parsedItems: {},
    operations: {},
    tags: {},
    servers: [],
  };
}
