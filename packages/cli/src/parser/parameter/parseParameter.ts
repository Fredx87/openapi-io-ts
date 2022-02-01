import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { OperationParameterIn, JSON_MEDIA_TYPE } from "@openapi-io-ts/core";
import {
  ComponentRef,
  createComponentRef,
  getOrCreateType,
  parsedItem,
  ParsedItem,
} from "../common";
import { ParserContext, ParserRTE } from "../context";
import { string } from "fp-ts";
import { ParsedParameter } from "./ParsedParameter";

export function parseParameter(
  name: string,
  param: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject
): ParserRTE<string | ParsedParameter> {
  if (JsonReference.is(param)) {
    return RTE.fromEither(createComponentRef("parameters", param.$ref));
  }

  return parseParameterObject(name, param);
}

export function parseParameterObject(
  name: string,
  param: OpenAPIV3.ParameterObject
): ParserRTE<ParsedItem<ParsedParameter>> {
  if (param.schema != null) {
    return parseParameterWithSchema(
      name,
      param,
      param.schema,
      "ParsedFormParameter"
    );
  }

  const jsonContentSchema = param.content?.[JSON_MEDIA_TYPE].schema;

  if (jsonContentSchema != null) {
    return parseParameterWithSchema(
      name,
      param,
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
  name: string,
  param: OpenAPIV3.ParameterObject,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  tag: ParsedParameter["_tag"]
): ParserRTE<ParsedItem<ParsedParameter>> {
  return pipe(
    RTE.Do,
    RTE.bind("type", () => getOrCreateType(name, schema)),
    RTE.bind("defaultValue", () => getDefaultValue(schema)),
    RTE.map(({ type, defaultValue }) =>
      buildParsedParameter(param, type, defaultValue, tag)
    )
  );
}

function getDefaultValue(
  s: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): ParserRTE<unknown> {
  return pipe(
    RTE.Do,
    RTE.bind("schema", () =>
      JsonReference.is(s)
        ? getOpenapiSchemaFromRef(s)
        : RTE.right<ParserContext, Error, OpenAPIV3.SchemaObject>(s)
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    RTE.map((obj) => obj.schema.default)
  );
}

function getOpenapiSchemaFromRef(
  ref: OpenAPIV3.ReferenceObject
): ParserRTE<OpenAPIV3.SchemaObject> {
  return pipe(
    RTE.asks(
      (context) =>
        context.document.components?.schemas?.[
          ref.$ref
        ] as OpenAPIV3.SchemaObject
    )
  );
}

function buildParsedParameter(
  param: OpenAPIV3.ParameterObject,
  type: gen.TypeDeclaration | gen.TypeReference,
  defaultValue: unknown,
  tag: ParsedParameter["_tag"]
): ParsedItem<ParsedParameter> {
  const { name } = param;
  const paramIn = param.in as OperationParameterIn;
  const required = param.required ?? false;

  const baseParameter: ParsedBaseParameter = {
    name,
    in: paramIn,
    required,
    type,
    defaultValue,
  };

  if (tag === "ParsedFormParameter") {
    const defaultExplode = paramIn === "query" || paramIn === "cookie";
    const item: ParsedFormParameter = {
      ...baseParameter,
      _tag: "ParsedFormParameter",
      explode: param.explode ?? defaultExplode,
    };
    return parsedItem(item, name);
  } else {
    const item: ParsedJsonParameter = {
      ...baseParameter,
      _tag: "ParsedJsonParameter",
    };
    return parsedItem(item, name);
  }
}
