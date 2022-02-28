import { ParsedOperation } from "./operation";
import { ParsedItem, ParsedItemType } from "./parsedItem";
import { ParsedServer } from "./server";

export interface ParserOutput {
  parsedItems: Record<string, ParsedItem<ParsedItemType>>;
  tags: Record<string, ParsedItem<ParsedOperation>[]>;
  servers: ParsedServer[];
}

export function parserOutput(): ParserOutput {
  return {
    parsedItems: {},
    tags: {},
    servers: [],
  };
}
