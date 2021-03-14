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
} from "./common";
import { ParserContext, ParserRTE } from "./context";

type ParsedParameterIn = "query" | "header" | "path" | "cookie";

export interface ParsedParameterObject {
  type: gen.TypeDeclaration | gen.TypeReference;
  name: string;
  in: ParsedParameterIn;
  required: boolean;
  defaultValue?: unknown;
}

export type ParsedParameter =
  | ComponentRef<"parameters">
  | InlineObject<ParsedParameterObject>;

export function parseParameter(
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): ParserRTE<ParsedParameter> {
  if (JsonReference.is(param)) {
    return getComponentRef("parameters", param.$ref);
  }

  return parseParameterObject(param);
}

export function parseParameterObject(
  param: OpenAPIV3.ParameterObject
): ParserRTE<InlineObject<ParsedParameterObject>> {
  const { schema, name, in: parameterIn, required } = param;

  if (schema == null) {
    return RTE.left(new Error(`'schema' not found in parameter ${param.name}`));
  }

  return pipe(
    getOrCreateType(name, schema),
    RTE.map((type) =>
      inlineObject({
        type,
        name,
        in: parameterIn as ParsedParameterIn,
        required: required || false,
        defaultValue: getDefaultValue(schema),
      })
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
