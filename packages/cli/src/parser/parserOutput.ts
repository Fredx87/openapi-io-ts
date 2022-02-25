import { ParsedItem, ParsedItemType } from "./parsedItem";
import { ParsedServer } from "./server";

export interface ParserOutput {
  parsedItems: Record<string, ParsedItem<ParsedItemType>>;
  tags: Record<string, string[]>;
  servers: ParsedServer[];
}

export function parserOutput(): ParserOutput {
  return {
    parsedItems: {},
    tags: {},
    servers: [],
  };
}
