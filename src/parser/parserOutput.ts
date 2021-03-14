import { ParsedComponents } from "./common";
import { ParsedOperation } from "./operation";

export interface ParserOutput {
  components: ParsedComponents;
  operations: Record<string, ParsedOperation>;
  tags: Record<string, string[]>;
}

export function parserOutput(): ParserOutput {
  return {
    components: {
      schemas: {},
      parameters: {},
      responses: {},
      bodies: {},
    },
    operations: {},
    tags: {},
  };
}
