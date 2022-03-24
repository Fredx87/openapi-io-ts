import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { JsonReference, jsonReferenceToString } from "json-schema-io-ts";
import { parsedItem } from ".";
import {
  modifyParserState,
  ParserContext,
  ParserRTE,
  readParserState,
} from "../context";
import { parsedItemModelGenerationInfo } from "../modelGeneration";
import { resolveStringReferenceInParser } from "../references";
import {
  ParsedItem,
  ParsedItemKind,
  ParsedItemKindTypeMap,
} from "./ParsedItem";

export function getParsedItem<K extends ParsedItemKind>(
  reference: string
): ParserRTE<O.Option<ParsedItem<K>>> {
  return pipe(
    readParserState(),
    RTE.map(
      (output) => output.parsedItems[reference] as ParsedItem<K> | undefined
    ),
    RTE.map(O.fromNullable)
  );
}

export function getOrCreateParsedItem<K extends ParsedItemKind>(
  jsonReference: JsonReference,
  parseFunction: (jsonReference: JsonReference) => ParserRTE<ParsedItem<K>>
): ParserRTE<ParsedItem<K>> {
  return pipe(
    getParsedItem<K>(jsonReferenceToString(jsonReference)),
    RTE.chain(O.fold(() => parseFunction(jsonReference), RTE.right))
  );
}

export function getOrCreateParsedItemFromRef<K extends ParsedItemKind>(
  $ref: string,
  parseFunction: (jsonReference: JsonReference) => ParserRTE<ParsedItem<K>>
): ParserRTE<ParsedItem<K>> {
  return pipe(
    resolveStringReferenceInParser($ref),
    RTE.chain((jsonReference) =>
      getOrCreateParsedItem(jsonReference, parseFunction)
    )
  );
}

export function createParsedItem<K extends ParsedItemKind>(
  jsonReference: JsonReference,
  kind: K,
  item: ParsedItemKindTypeMap[K]
): ParserRTE<ParsedItem<K>> {
  return pipe(
    RTE.asks((c: ParserContext) => c.parseSchemaContext),
    RTE.map((parseSchemaContext) =>
      parsedItemModelGenerationInfo(jsonReference, parseSchemaContext)
    ),
    RTE.chain((modelGenerationInfo) => {
      const parsed = parsedItem(kind, item, modelGenerationInfo);

      return pipe(
        addParsedItemToOutputIfNeeded(jsonReference, parsed),
        RTE.map(() => parsed)
      );
    })
  );
}

function addParsedItemToOutputIfNeeded<K extends ParsedItemKind>(
  jsonReference: JsonReference,
  parsedItem: ParsedItem<K>
): ParserRTE<void> {
  if (O.isNone(parsedItem.modelGenerationInfo)) {
    return RTE.right(undefined);
  }

  return modifyParserState((draft) => {
    draft.parsedItems[jsonReferenceToString(jsonReference)] = parsedItem;
  });
}
