import {
  FORM_ENCODED_MEDIA_TYPE,
  JSON_MEDIA_TYPE,
  MULTIPART_FORM_MEDIA_TYPE,
  TEXT_PLAIN_MEDIA_TYPE,
} from "@openapi-io-ts/core";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import {
  concatJsonReference,
  JsonReference,
  JsonSchemaRef,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { ParserRTE } from "../context";
import {
  createParsedItem,
  getOrCreateParsedItemFromRef,
  ParsedItem,
  ParsedItemSchema,
  parseItemSchema,
} from "../parsedItem";
import { resolveObjectFromJsonReference } from "../references";
import {
  ParsedBinaryBody,
  ParsedFormBody,
  ParsedJsonBody,
  ParsedMultipartBody,
  ParsedTextBody,
} from "./ParsedBody";

export function parseBodyFromReference(
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"body">> {
  return pipe(
    resolveObjectFromJsonReference<
      OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject
    >(jsonReference),
    RTE.chain((body) => parseBody(body, jsonReference))
  );
}

function parseBody(
  body: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"body">> {
  if (JsonSchemaRef.is(body)) {
    return getOrCreateParsedItemFromRef<"body">(
      body.$ref,
      parseBodyFromReference
    );
  }

  return parseBodyObject(body, jsonReference);
}

function parseBodyObject(
  body: OpenAPIV3_1.RequestBodyObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"body">> {
  const { content } = body;
  const required = body.required ?? false;

  const jsonContent = content?.[JSON_MEDIA_TYPE];

  if (jsonContent) {
    const jsonContentRef = concatJsonReference(jsonReference, [
      "content",
      JSON_MEDIA_TYPE,
      "schema",
    ]);
    return pipe(
      parseItemSchema(jsonContentRef),
      RTE.chain((schema) => {
        const parsedBody: ParsedJsonBody = {
          _tag: "ParsedJsonBody",
          schema,
          required,
        };
        return createParsedItem(jsonReference, "body", parsedBody);
      })
    );
  }

  const textPlainContent = content?.[TEXT_PLAIN_MEDIA_TYPE];

  if (textPlainContent) {
    const parsedBody: ParsedTextBody = {
      _tag: "ParsedTextBody",
      required,
    };
    return createParsedItem(jsonReference, "body", parsedBody);
  }

  const formEncodedContent = content?.[FORM_ENCODED_MEDIA_TYPE];

  if (formEncodedContent) {
    const formEncodedContentRef = concatJsonReference(jsonReference, [
      "content",
      FORM_ENCODED_MEDIA_TYPE,
      "schema",
    ]);

    return pipe(
      getOrCreateSchemaFromOptional(
        formEncodedContentRef,
        formEncodedContent.schema
      ),
      RTE.chain((schema) => {
        const parsedBody: ParsedFormBody = {
          _tag: "ParsedFormBody",
          schema,
          required,
        };
        return createParsedItem(jsonReference, "body", parsedBody);
      })
    );
  }

  const multipartFormContent = content?.[MULTIPART_FORM_MEDIA_TYPE];

  if (multipartFormContent) {
    const multipartFormContentRef = concatJsonReference(jsonReference, [
      "content",
      MULTIPART_FORM_MEDIA_TYPE,
      "schema",
    ]);

    return pipe(
      getOrCreateSchemaFromOptional(
        multipartFormContentRef,
        multipartFormContent.schema
      ),
      RTE.chain((schema) => {
        const parsedBody: ParsedMultipartBody = {
          _tag: "ParsedMultipartBody",
          schema,
          required,
        };
        return createParsedItem(jsonReference, "body", parsedBody);
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

  return createParsedItem(jsonReference, "body", parsedBody);
}

function getOrCreateSchemaFromOptional(
  jsonReference: JsonReference,
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined
): ParserRTE<ParsedItemSchema> {
  if (schema == null) {
    return RTE.right({
      _tag: "ParsedItemTypeReference",
      typeReference: gen.unknownType,
    });
  }
  return parseItemSchema(jsonReference);
}
