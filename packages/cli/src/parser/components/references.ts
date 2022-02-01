import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { resolveStringReference } from "json-schema-io-ts";
import { ParserRTE, readParserOutput } from "../context";
import { getObjectFromStringReference } from "../references";
import {
  ComponentReference,
  ComponentType,
  ComponentTypeParsedItemMap,
} from "./ParsedComponents";

export function getComponent<T extends ComponentType>(
  componentType: T,
  reference: string
): ParserRTE<O.Option<ComponentTypeParsedItemMap[T]>> {
  return pipe(
    readParserOutput(),
    RTE.map(
      (output) =>
        output.components[componentType][reference] as
          | ComponentTypeParsedItemMap[T]
          | undefined
    ),
    RTE.map(O.fromNullable)
  );
}

export function getOrCreateComponent<T, CompT extends ComponentType>(
  componentType: CompT,
  reference: string,
  parseFunction: (
    documentObject: T
  ) => ParserRTE<ComponentTypeParsedItemMap[CompT]>
) {
  return pipe(
    getComponent(componentType, reference),
    RTE.chain(
      O.fold(
        () =>
          pipe(
            getObjectFromStringReference<T>(reference),
            RTE.chain((obj) => parseFunction(obj))
          ),
        (a) => RTE.right(a)
      )
    )
  );
}

export function createComponentAndReturnReference<T extends ComponentType>(
  componentType: T,
  item: ComponentTypeParsedItemMap[T],
  reference: string
): ParserRTE<ComponentReference<T>> {
  return pipe(
    RTE.Do,
    RTE.bind("jsonReference", () => resolveStringReference(reference))
  );
}
