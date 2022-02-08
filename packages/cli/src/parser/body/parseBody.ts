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
  parsedItem,
  ParsedItem,
  getOrCreateParsedItemFromRef,
} from "../parsedItem";
import {
  getOrCreateModel,
  resolveObjectFromJsonReference,
} from "../references";
import { ParsedBody, ParsedJsonBody } from "./ParsedBody";

export function parseBodyFromReference(
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedBody>> {
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
): ParserRTE<ParsedItem<ParsedBody>> {
  if (JsonSchemaRef.is(body)) {
    return getOrCreateParsedItemFromRef<ParsedBody>(
      body.$ref,
      parseBodyFromReference
    );
  }

  return parseBodyObject(body, jsonReference);
}

function parseBodyObject(
  body: OpenAPIV3_1.RequestBodyObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedBody>> {
  const { content } = body;
  const required = body.required ?? false;

  const jsonContent = content?.[JSON_MEDIA_TYPE];

  if (jsonContent) {
    const jsonContentRef = concatJsonReference(jsonReference, [
      "content",
      JSON_MEDIA_TYPE,
    ]);
    return pipe(
      getOrCreateModel(jsonContentRef),
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
