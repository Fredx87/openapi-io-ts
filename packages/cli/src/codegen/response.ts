import { pipe } from "fp-ts/function";
import { ResponseItemOrRef } from "../parser/response";
import { getItemOrRefPrefix, getParsedItem } from "./common";
import { CodegenRTE } from "./context";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import * as gen from "io-ts-codegen";

export function generateOperationResponses(
  responses: Record<string, ResponseItemOrRef>
): CodegenRTE<string> {
  return pipe(
    responses,
    R.traverseWithIndex(RTE.readerTaskEitherSeq)((_, itemOrRef) =>
      generateOperationResponse(itemOrRef)
    ),
    RTE.map((responses) => {
      const items = Object.entries(responses)
        .map(([code, response]) => `"${code}": ${response}`)
        .join(",\n");
      return `{ ${items} }`;
    })
  );
}

export function generateOperationResponse(
  itemOrRef: ResponseItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(itemOrRef),
    RTE.map((response) => {
      if (response.item._tag === "ParsedEmptyResponse") {
        return `{ _tag: "EmptyResponse" }`;
      }

      if (response.item._tag === "ParsedFileResponse") {
        return `{ _tag: "FileResponse" }`;
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
