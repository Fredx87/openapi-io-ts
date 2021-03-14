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
import { ParserRTE } from "./context";

type ParsedParameterIn = "query" | "header" | "path" | "cookie";

export interface ParsedParameterObject {
  type: gen.TypeDeclaration | gen.TypeReference;
  name: string;
  in: ParsedParameterIn;
  required: boolean;
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
      })
    )
  );
}
