import { IORef } from "fp-ts/IORef";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce, { Draft } from "immer";
import { OpenAPIV3 } from "openapi-types";
import { ParserOutput } from "./parserOutput";

export interface ParserContext {
  document: OpenAPIV3.Document;
  outputRef: IORef<ParserOutput>;
}

export type ParserRTE<A> = RTE.ReaderTaskEither<ParserContext, Error, A>;

export function readParserOutput(): ParserRTE<ParserOutput> {
  return pipe(
    RTE.asks((e: ParserContext) => e.outputRef),
    RTE.chain((ref) => RTE.rightIO(ref.read))
  );
}

export function modifyParserOutput(
  recipe: (draft: Draft<ParserOutput>) => void
): ParserRTE<void> {
  return pipe(
    RTE.asks((e: ParserContext) => e.outputRef),
    RTE.chain((ref) =>
      RTE.fromIO(ref.modify((output) => produce(output, recipe)))
    )
  );
}
