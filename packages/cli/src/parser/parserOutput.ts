import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { GeneratedModels } from "json-schema-io-ts";
import { ParserContext, ParserRTE, ParserState } from "./context";

export interface ParserOutput extends ParserState {
  parsedSchemas: GeneratedModels;
}

export function getParserOutput(): ParserRTE<ParserOutput> {
  return pipe(
    RTE.Do,
    RTE.bind("parserContext", () => RTE.ask<ParserContext>()),
    RTE.bind("parsedState", ({ parserContext }) =>
      RTE.rightIO(parserContext.parserStateRef.read)
    ),
    RTE.bind("parsedSchemas", ({ parserContext }) =>
      RTE.rightIO(parserContext.parseSchemaContext.generatedModelsRef.read)
    ),
    RTE.map(({ parsedState, parsedSchemas }) => ({
      ...parsedState,
      parsedSchemas,
    }))
  );
}
