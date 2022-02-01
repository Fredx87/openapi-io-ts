import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ParserRTE, readParserOutput } from "../context";
import { ReferencedParsedItems } from "./ParsedItem";

export function getReferencedParsedItem<
  Key extends keyof ReferencedParsedItems
>(
  key: Key,
  reference: string
): ParserRTE<O.Option<ReferencedParsedItems[Key][string]>> {
  return pipe(
    readParserOutput(),
    RTE.map(
      (output) =>
        output.referencedParsedItems[key][reference] as
          | ReferencedParsedItems[Key][string]
          | undefined
    ),
    RTE.map(O.fromNullable)
  );
}
