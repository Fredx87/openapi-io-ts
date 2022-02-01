import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3_1 } from "openapi-types";
import {
  JSON_MEDIA_TYPE,
  TEXT_PLAIN_MEDIA_TYPE,
  FORM_ENCODED_MEDIA_TYPE,
  MULTIPART_FORM_MEDIA_TYPE,
} from "@openapi-io-ts/core";
import { ParserRTE } from "../context";
import { JsonSchemaRef } from "json-schema-io-ts";
import {
  ParsedItem,
  ParsedItemOrComponentReference,
} from "../parsedItem/ParsedItem";
import { ParsedBody } from "./ParsedBody";
import { getOrCreateComponent } from "../components";

export function parseBody(
  body: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject
): ParserRTE<ParsedItemOrComponentReference<"requestBodies">> {
  if (JsonSchemaRef.is(body)) {
    return getOrCreateComponent("requestBodies", body.$ref, parseBodyObject);
  }

  return parseBodyObject(body);
}

export function parseBodyObject(
  body: OpenAPIV3_1.RequestBodyObject
): ParserRTE<ParsedItem<ParsedBody>> {
  const { content } = body;
  const required = body.required ?? false;

  const jsonContent = content?.[JSON_MEDIA_TYPE];

  if (jsonContent) {
    return pipe(
      getOrCreateTypeFromOptional(name, jsonContent.schema),
      RTE.map((type) => {
        const parsedBody: ParsedJsonBody = {
          _tag: "ParsedJsonBody",
          type,
          required,
        };
        return parsedItem(parsedBody, name);
      })
    );
  }

  const textPlainContent = content?.[TEXT_PLAIN_MEDIA_TYPE];

  if (textPlainContent) {
    const parsedBody: ParsedTextBody = {
      _tag: "ParsedTextBody",
      required,
    };
    return RTE.right(parsedItem(parsedBody, name));
  }

  const formEncodedContent = content?.[FORM_ENCODED_MEDIA_TYPE];

  if (formEncodedContent) {
    return pipe(
      getOrCreateTypeFromOptional(name, formEncodedContent.schema),
      RTE.map((type) => {
        const parsedBody: ParsedFormBody = {
          _tag: "ParsedFormBody",
          type,
          required,
        };
        return parsedItem(parsedBody, name);
      })
    );
  }

  const multipartFormContent = content?.[MULTIPART_FORM_MEDIA_TYPE];

  if (multipartFormContent) {
    return pipe(
      getOrCreateTypeFromOptional(name, multipartFormContent.schema),
      RTE.map((type) => {
        const parsedBody: ParsedMultipartBody = {
          _tag: "ParsedMultipartBody",
          type,
          required,
        };
        return parsedItem(parsedBody, name);
      })
    );
  }

  const mediaTypes = Object.keys(content);
  const mediaType = mediaTypes.length > 0 ? mediaTypes[0] : "*/*";

  const parsedBody: ParsedBinaryBody = {
    _tag: "ParsedBinaryBody",
    mediaType,
    required,
  };

  return RTE.right(parsedItem(parsedBody, name));
}

function getOrCreateTypeFromOptional(
  name: string,
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined
): ParserRTE<gen.TypeDeclaration | gen.TypeReference> {
  if (schema == null) {
    return RTE.right(gen.unknownType);
  }
  return getOrCreateType(name, schema);
}
