import { pipe } from "fp-ts/function";
import { ResponseItemOrRef } from "../parser/response";
import { getItemOrRefPrefix, getParsedItem } from "./common";
import { CodegenRTE } from "./context";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";

export function generateResponseDefinition(
  itemOrRef: ResponseItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(itemOrRef),
    RTE.map((response) => {
      if (response.item._tag === "TextResponse") {
        return `{ _tag: "TextResponse"}`;
      }

      const { type } = response.item;

      const runtimeType =
        type.kind === "TypeDeclaration"
          ? `${getItemOrRefPrefix(response)}${type.name}`
          : gen.printRuntime(type);

      return `{ _tag: "JsonResponse", decoder: ${runtimeType}}`;
    })
  );
}
