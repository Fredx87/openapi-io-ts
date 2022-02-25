import { JSON_MEDIA_TYPE } from "@openapi-io-ts/core";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  concatJsonReference,
  JsonReference,
  JsonSchemaRef,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { ParsedEmptyResponse, ParsedFileResponse, ParsedJsonResponse } from ".";
import { ParserRTE } from "../context";
import {
  createParsedItem,
  getOrCreateParsedItemFromRef,
  ParsedItem,
  parseItemSchema,
} from "../parsedItem";
import { resolveObjectFromJsonReference } from "../references";
import { ParsedResponse } from "./ParsedResponse";

export function parseResponseFromReference(
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedResponse>> {
  return pipe(
    resolveObjectFromJsonReference<
      OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject
    >(jsonReference),
    RTE.chain((response) => parseResponse(response, jsonReference))
  );
}

function parseResponse(
  response: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedResponse>> {
  if (JsonSchemaRef.is(response)) {
    return getOrCreateParsedItemFromRef<ParsedResponse>(
      response.$ref,
      parseResponseFromReference
    );
  }

  return parseResponseObject(response, jsonReference);
}

function parseResponseObject(
  response: OpenAPIV3_1.ResponseObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedResponse>> {
  const { content } = response;

  const jsonSchema = content?.[JSON_MEDIA_TYPE]?.schema;

  if (jsonSchema != null) {
    const schemaRef = concatJsonReference(jsonReference, [
      "content",
      JSON_MEDIA_TYPE,
      "schema",
    ]);

    return pipe(
      parseItemSchema(schemaRef),
      RTE.chain((schema) => {
        const item: ParsedJsonResponse = {
          _tag: "ParsedJsonResponse",
          schema,
        };
        return createParsedItem(jsonReference, item);
      })
    );
  }

  const contents = content && Object.values(content);

  if (contents == null || contents.length === 0 || contents[0].schema == null) {
    const item: ParsedEmptyResponse = {
      _tag: "ParsedEmptyResponse",
    };
    return createParsedItem(jsonReference, item);
  }

  const firstContentSchema = contents[0].schema;
  const firstContentSchemaRef = concatJsonReference(jsonReference, [
    "contents",
    "0",
    "schema",
  ]);

  if (
    !JsonSchemaRef.is(firstContentSchema) &&
    firstContentSchema.type === "string" &&
    firstContentSchema.format === "binary"
  ) {
    const item: ParsedFileResponse = {
      _tag: "ParsedFileResponse",
    };
    return createParsedItem(jsonReference, item);
  }

  return pipe(
    parseItemSchema(firstContentSchemaRef),
    RTE.chain((schema) => {
      const item: ParsedJsonResponse = {
        _tag: "ParsedJsonResponse",
        schema,
      };
      return createParsedItem(jsonReference, item);
    })
  );
}
