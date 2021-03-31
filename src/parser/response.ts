import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";
import {
  createComponentRef,
  getOrCreateType,
  parsedItem,
  ParsedItem,
  JSON_MEDIA_TYPE,
  ComponentRef,
} from "./common";
import { ParserRTE } from "./context";

interface ParsedJsonResponse {
  _tag: "JsonResponse";
  type: gen.TypeDeclaration | gen.TypeReference;
}

interface ParsedTextResponse {
  _tag: "TextResponse";
}

export type ParsedResponse = ParsedJsonResponse | ParsedTextResponse;

export type ResponseItemOrRef =
  | ParsedItem<ParsedResponse>
  | ComponentRef<"responses">;

export function parseResponse(
  name: string,
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
): ParserRTE<ResponseItemOrRef> {
  if (JsonReference.is(response)) {
    return RTE.fromEither(createComponentRef("responses", response.$ref));
  }

  return parseResponseObject(name, response);
}

export function parseResponseObject(
  name: string,
  response: OpenAPIV3.ResponseObject
): ParserRTE<ParsedItem<ParsedResponse>> {
  const { content } = response;

  const jsonSchema = content?.[JSON_MEDIA_TYPE]?.schema;

  if (jsonSchema == null) {
    return RTE.right(parsedItem({ _tag: "TextResponse" }, name));
  }

  return pipe(
    getOrCreateType(name, jsonSchema),
    RTE.map((type) => parsedItem({ _tag: "JsonResponse", type }, name))
  );
}
