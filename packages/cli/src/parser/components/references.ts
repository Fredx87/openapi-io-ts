import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ParserRTE, readParserOutput } from "../context";
import { ParsedItem } from "../ParsedItem";
import { ComponentReference, ComponentType } from "./ParsedComponents";

export function getComponent<T extends ComponentType>(
  componentType: T,
  reference: string
): ParserRTE<O.Option<ParsedItem<T>>> {
  return pipe(
    readParserOutput(),
    RTE.map(
      (output) =>
        output.components[componentType][reference] as unknown as
          | ParsedItem<T>
          | undefined
    ),
    RTE.map(O.fromNullable)
  );
}

// export function createComponentAndReturnReference<T extends ComponentType>(
//   componentType: T,
//   item: T,
//   reference: string
// ): ParserRTE<ComponentReference<T>> {}
