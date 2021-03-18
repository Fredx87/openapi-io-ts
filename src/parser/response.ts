import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";
import {
  ComponentRef,
  getComponentRef,
  getOrCreateType,
  inlineObject,
  InlineObject,
  JSON_MEDIA_TYPE,
} from "./common";
import { ParserRTE } from "./context";

interface ParsedJsonResponse {
  _tag: "JsonResponse";
  type: gen.TypeDeclaration | gen.TypeReference;
}

interface ParsedTextResponse {
  _tag: "TextResponse";
}

export type ParsedResponseObject = ParsedJsonResponse | ParsedTextResponse;

export type ParsedResponse =
  | ComponentRef<"responses">
  | InlineObject<ParsedResponseObject>;

export function parseResponse(
  name: string,
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
): ParserRTE<ParsedResponse> {
  if (JsonReference.is(response)) {
    return getComponentRef("responses", response.$ref);
  }

  return parseResponseObject(name, response);
}

export function parseResponseObject(
  name: string,
  response: OpenAPIV3.ResponseObject
): ParserRTE<InlineObject<ParsedResponseObject>> {
  const { content } = response;

  const jsonSchema = content?.[JSON_MEDIA_TYPE]?.schema;

  if (jsonSchema == null) {
    return RTE.right(inlineObject({ _tag: "TextResponse" }));
  }

  return pipe(
    getOrCreateType(name, jsonSchema),
    RTE.map((type) =>
      inlineObject<ParsedJsonResponse>({ _tag: "JsonResponse", type })
    )
  );
}
