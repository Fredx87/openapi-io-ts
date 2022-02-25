import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { JsonReference, jsonReferenceToString } from "json-schema-io-ts";
import { parsedItem } from ".";
import {
  modifyParserOutput,
  ParserContext,
  ParserRTE,
  readParserOutput,
} from "../context";
import { parsedItemModelGenerationInfo } from "../modelGeneration";
import { resolveStringReferenceInParser } from "../references";
import { ParsedItem, ParsedItemType } from "./ParsedItem";

export function getParsedItem<T extends ParsedItemType>(
  reference: string
): ParserRTE<O.Option<ParsedItem<T>>> {
  return pipe(
    readParserOutput(),
    RTE.map(
      (output) => output.parsedItems[reference] as ParsedItem<T> | undefined
    ),
    RTE.map(O.fromNullable)
  );
}

export function getOrCreateParsedItem<T extends ParsedItemType>(
  jsonReference: JsonReference,
  parseFunction: (jsonReference: JsonReference) => ParserRTE<ParsedItem<T>>
): ParserRTE<ParsedItem<T>> {
  return pipe(
    getParsedItem<T>(jsonReferenceToString(jsonReference)),
    RTE.chain(O.fold(() => parseFunction(jsonReference), RTE.right))
  );
}

export function getOrCreateParsedItemFromRef<T extends ParsedItemType>(
  $ref: string,
  parseFunction: (jsonReference: JsonReference) => ParserRTE<ParsedItem<T>>
): ParserRTE<ParsedItem<T>> {
  return pipe(
    resolveStringReferenceInParser($ref),
    RTE.chain((jsonReference) =>
      getOrCreateParsedItem(jsonReference, parseFunction)
    )
  );
}

export function createParsedItem<T extends ParsedItemType>(
  jsonReference: JsonReference,
  item: T
): ParserRTE<ParsedItem<T>> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.map((parseSchemaContext) =>
      parsedItemModelGenerationInfo(jsonReference, parseSchemaContext)
    ),
    RTE.chain((modelGenerationInfo) => {
      const parsed = parsedItem(item, modelGenerationInfo);

      return pipe(
        addParsedItemToOutputIfNeeded(jsonReference, parsed),
        RTE.map(() => parsed)
      );
    })
  );
}

function addParsedItemToOutputIfNeeded<T extends ParsedItemType>(
  jsonReference: JsonReference,
  parsedItem: ParsedItem<T>
): ParserRTE<void> {
  if (O.isNone(parsedItem.modelGenerationInfo)) {
    return RTE.right(undefined);
  }

  return modifyParserOutput((draft) => {
    draft.parsedItems[jsonReferenceToString(jsonReference)] = parsedItem;
  });
}
