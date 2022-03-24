import { pipe } from "fp-ts/function";
import { IORef } from "fp-ts/IORef";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce, { Draft } from "immer";
import { ParseSchemaContext } from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { ParsedItem, ParsedItemKind } from "./parsedItem";
import { ParsedServer } from "./server";

export interface ParserState {
  parsedItems: Record<string, ParsedItem<ParsedItemKind>>;
  tags: Record<string, ParsedItem<"operation">[]>;
  servers: ParsedServer[];
}

export function parserState(): ParserState {
  return {
    parsedItems: {},
    tags: {},
    servers: [],
  };
}

export interface ParserContext {
  document: OpenAPIV3_1.Document;
  parserStateRef: IORef<ParserState>;
  parseSchemaContext: ParseSchemaContext;
}

export type ParserRTE<A> = RTE.ReaderTaskEither<ParserContext, Error, A>;

export function readParserState(): ParserRTE<ParserState> {
  return pipe(
    RTE.asks((e: ParserContext) => e.parserStateRef),
    RTE.chain((ref) => RTE.rightIO(ref.read))
  );
}

export function modifyParserState(
  recipe: (draft: Draft<ParserState>) => void
): ParserRTE<void> {
  return pipe(
    RTE.asks((e: ParserContext) => e.parserStateRef),
    RTE.chain((ref) =>
      RTE.fromIO(ref.modify((output) => produce(output, recipe)))
    )
  );
}
