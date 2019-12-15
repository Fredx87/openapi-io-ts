import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as SRTE from "fp-ts/lib/StateReaderTaskEither";
import { get } from "lodash";
import { OpenAPIV3 } from "openapi-types";
import { ParserConfiguration } from "./parser-configuration";
import { ParserContext } from "./parser-context";

export type ParserSRTE = SRTE.StateReaderTaskEither<
  ParserContext,
  ParserConfiguration,
  string,
  void
>;

export type ParserRTE = RTE.ReaderTaskEither<ParserConfiguration, string, void>;

export function pascalCase(input: string): string {
  const charArray = input.split("");
  const copy = [...charArray];
  copy[0] = copy[0].toUpperCase();
  return copy.join("");
}

export function getObjectByRef(
  ref: OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document
) {
  const chunks = ref.$ref.split("/");
  const path = chunks.splice(1, chunks.length).join(".");
  return get(document, path);
}

export function isReference(obj: any): obj is OpenAPIV3.ReferenceObject {
  return "$ref" in obj;
}
