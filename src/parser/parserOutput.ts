import { ParsedComponents } from "./common";
import { ParsedOperation } from "./operation";
import { ParsedServer } from "./server";

export interface ParserOutput {
  components: ParsedComponents;
  operations: Record<string, ParsedOperation>;
  tags: Record<string, string[]>;
  servers: ParsedServer[];
}

export function parserOutput(): ParserOutput {
  return {
    components: {
      schemas: {},
      parameters: {},
      responses: {},
      requestBodies: {},
    },
    operations: {},
    tags: {},
    servers: [],
  };
}
