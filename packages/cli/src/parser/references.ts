import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { parseSchema } from "json-schema-io-ts";
import { ParsedItem } from "./common";
import { ParsedComponents } from "./components";
import { ParserContext, ParserRTE, readParserOutput } from "./context";

export function getOrCreateModel(
  reference: string
): ParserRTE<gen.TypeReference> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.chainW((parseSchemaContext) =>
      pipe(parseSchema(reference)(parseSchemaContext), RTE.fromTaskEither)
    )
  );
}
