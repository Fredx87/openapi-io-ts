import { JSON_MEDIA_TYPE, OperationParameterIn } from "@openapi-io-ts/core";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  concatJsonReference,
  JsonReference,
  JsonSchemaRef,
} from "json-schema-io-ts";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ParserContext, ParserRTE } from "../context";
import {
  createParsedItem,
  getOrCreateParsedItemFromRef,
  ParsedItem,
  ParsedItemSchema,
  parseItemSchema,
} from "../parsedItem";
import {
  getObjectFromStringReference,
  resolveObjectFromJsonReference,
} from "../references";
import {
  ParsedBaseParameter,
  ParsedFormParameter,
  ParsedJsonParameter,
  ParsedParameter,
} from "./ParsedParameter";

export function parseParameterFromReference(
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"parameter">> {
  return pipe(
    resolveObjectFromJsonReference<
      OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject
    >(jsonReference),
    RTE.chain((parameter) => parseParameter(parameter, jsonReference))
  );
}

function parseParameter(
  param: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"parameter">> {
  if (JsonSchemaRef.is(param)) {
    return getOrCreateParsedItemFromRef<"parameter">(
      param.$ref,
      parseParameterFromReference
    );
  }

  return parseParameterObject(param, jsonReference);
}

function parseParameterObject(
  param: OpenAPIV3.ParameterObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<"parameter">> {
  if (param.schema != null) {
    const schemaRef = concatJsonReference(jsonReference, ["schema"]);

    return parseParameterWithSchema(
      jsonReference,
      param,
      schemaRef,
      param.schema,
      "ParsedFormParameter"
    );
  }

  const jsonContentSchema = param.content?.[JSON_MEDIA_TYPE].schema;

  if (jsonContentSchema != null) {
    const schemaRef = concatJsonReference(jsonReference, [
      "content",
      JSON_MEDIA_TYPE,
      "schema",
    ]);

    return parseParameterWithSchema(
      jsonReference,
      param,
      schemaRef,
      jsonContentSchema,
      "ParsedJsonParameter"
    );
  }

  return RTE.left(
    new Error(
      `Error parsing parameter ${param.name}: no schema or application/json schema defined`
    )
  );
}

function parseParameterWithSchema(
  jsonReference: JsonReference,
  param: OpenAPIV3.ParameterObject,
  schemaRef: JsonReference,
  schemaObj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  tag: ParsedParameter["_tag"]
): ParserRTE<ParsedItem<"parameter">> {
  return pipe(
    RTE.Do,
    RTE.bind("schema", () => parseItemSchema(schemaRef)),
    RTE.bind("defaultValue", () => getDefaultValue(schemaObj)),
    RTE.chain(({ schema, defaultValue }) =>
      buildParsedParameter(jsonReference, param, schema, defaultValue, tag)
    )
  );
}

function getDefaultValue(
  s: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): ParserRTE<unknown> {
  return pipe(
    RTE.Do,
    RTE.bind("schema", () =>
      JsonSchemaRef.is(s)
        ? getObjectFromStringReference<OpenAPIV3.SchemaObject>(s.$ref)
        : RTE.right<ParserContext, Error, OpenAPIV3.SchemaObject>(s)
    ),
    RTE.map((obj) => obj.schema.default)
  );
}

function buildParsedParameter(
  jsonReference: JsonReference,
  param: OpenAPIV3.ParameterObject,
  schema: ParsedItemSchema,
  defaultValue: unknown,
  tag: ParsedParameter["_tag"]
): ParserRTE<ParsedItem<"parameter">> {
  const { name } = param;
  const paramIn = param.in as OperationParameterIn;
  const required = param.required ?? false;

  const baseParameter: ParsedBaseParameter = {
    name,
    in: paramIn,
    required,
    schema,
    defaultValue,
  };

  if (tag === "ParsedFormParameter") {
    const defaultExplode = paramIn === "query" || paramIn === "cookie";
    const item: ParsedFormParameter = {
      ...baseParameter,
      _tag: "ParsedFormParameter",
      explode: param.explode ?? defaultExplode,
    };
    return createParsedItem(jsonReference, "parameter", item);
  } else {
    const item: ParsedJsonParameter = {
      ...baseParameter,
      _tag: "ParsedJsonParameter",
    };
    return createParsedItem(jsonReference, "parameter", item);
  }
}
