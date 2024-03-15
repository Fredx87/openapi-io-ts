import { pipe } from "fp-ts/function";
import { ParsedItem } from "../parser/common";
import { ParsedResponse, ResponseItemOrRef } from "../parser/response";
import { capitalize } from "../utils";
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
    R.traverseWithIndex(RTE.ApplicativeSeq)((_, itemOrRef) =>
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

export function generateComponentResponse(
  itemOrRef: ResponseItemOrRef
): CodegenRTE<string> {
  return pipe(
    getParsedItem(itemOrRef),
    RTE.map((response: ParsedItem<ParsedResponse>) => {
      const baseName = capitalize(response.name, "camel");
      const schemaName = capitalize(response.name, "pascal");

      if (response.item._tag === "ParsedEmptyResponse") {
        return `export const ${schemaName} = t.never();

          export const ${baseName} = { _tag: "EmptyResponse" };`;
      }

      if (response.item._tag === "ParsedFileResponse") {
        return `export const ${schemaName} = t.never();

          export const ${baseName} = { _tag: "FileResponse" };`;
      }

      const type = response.item.type;
      const decoder = type.kind === "TypeDeclaration" ? type.type : type;

      return `export const ${schemaName}: t.Type<${schemaName}> = ${gen.printRuntime(
        decoder
      )};

        export const ${baseName} = { _tag: "JsonResponse", decoder: ${schemaName} };

        export interface ${schemaName} ${gen.printStatic(decoder)};`;
    })
  );
}
