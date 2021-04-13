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
  ComponentRef,
} from "./common";
import { JSON_MEDIA_TYPE } from "../common/mediaTypes";
import { ParserRTE } from "./context";

export interface ParsedEmptyResponse {
  _tag: "ParsedEmptyResponse";
}

export interface ParsedFileResponse {
  _tag: "ParsedFileResponse";
}

export interface ParsedJsonResponse {
  _tag: "ParsedJsonResponse";
  type: gen.TypeDeclaration | gen.TypeReference;
}

export type ParsedResponse =
  | ParsedEmptyResponse
  | ParsedFileResponse
  | ParsedJsonResponse;

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

  if (jsonSchema != null) {
    return pipe(
      getOrCreateType(name, jsonSchema),
      RTE.map((type) => parsedItem({ _tag: "ParsedJsonResponse", type }, name))
    );
  }

  const contents = content && Object.values(content);

  if (contents == null || contents.length === 0 || contents[0].schema == null) {
    return RTE.right(parsedItem({ _tag: "ParsedEmptyResponse" }, name));
  }

  const firstContentSchema = contents[0].schema;

  if (
    !JsonReference.is(firstContentSchema) &&
    firstContentSchema.type === "string" &&
    firstContentSchema.format === "binary"
  ) {
    return RTE.right(parsedItem({ _tag: "ParsedFileResponse" }, name));
  }

  return pipe(
    getOrCreateType(name, firstContentSchema),
    RTE.map((type) => parsedItem({ _tag: "ParsedJsonResponse", type }, name))
  );
}
