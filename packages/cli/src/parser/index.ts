import { pipe } from "fp-ts/function";
import { newIORef } from "fp-ts/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import { Environment, ProgramRTE } from "../environment";
import { ParserContext, parserState } from "./context";
import { main } from "./main";
import { parseDocument } from "./parseDocument";
import { ParserOutput } from "./parserOutput";

export function parse(): ProgramRTE<ParserOutput> {
  return pipe(
    createParserContext(),
    RTE.chain((context) => RTE.fromTaskEither(main()(context)))
  );
}

function createParserContext(): ProgramRTE<ParserContext> {
  return pipe(
    RTE.ask<Environment>(),
    RTE.bindTo("env"),
    RTE.bind("parsedDocument", ({ env }) =>
      RTE.fromTaskEither(parseDocument(env.inputFile))
    ),
    RTE.bind("parserStateRef", () => RTE.rightIO(newIORef(parserState()))),
    RTE.map(
      ({
        parsedDocument: { document, parseSchemaContext },
        parserStateRef,
      }) => ({
        document,
        parserStateRef,
        parseSchemaContext,
      })
    )
  );
}
