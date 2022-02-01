import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParsedBody } from "./body";
import { ParserRTE, readParserOutput } from "./context";
import { ParsedParameter } from "./parameter/parseParameter";
import { ParsedResponse } from "./response/parseResponse";
import { JsonSchemaRef } from "json-schema-io-ts";

export function createComponentRef<T extends ComponentType>(
  componentType: T,
  pointer: string
): E.Either<Error, ComponentRef<T>> {
  return pipe(
    createJsonPointer(pointer),
    E.chain((jsonPointer) => checkValidReference(componentType, jsonPointer)),
    E.map((jsonPointer) => componentRef(componentType, jsonPointer.toString()))
  );
}

export function getOrCreateType(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): ParserRTE<gen.TypeDeclaration | gen.TypeReference> {
  if (JsonSchemaRef.is(schema)) {
    return pipe(
      getComponent("schemas", schema.$ref),
      RTE.map((component) =>
        gen.customCombinator(
          `schemas.${component.name}`,
          `schemas.${component.name}`
        )
      )
    );
  }

  return pipe(
    parseSchema(schema),
    RTE.fromEither,
    RTE.map((type) => createDeclarationOrReturnType(`${name}Schema`, type))
  );
}

function getGeneratedModel();

function createDeclarationOrReturnType(
  name: string,
  type: gen.TypeReference
): gen.TypeDeclaration | gen.TypeReference {
  return shouldCreateDeclaration(type)
    ? gen.typeDeclaration(name, type, true)
    : type;
}

function shouldCreateDeclaration(type: gen.TypeReference): boolean {
  switch (type.kind) {
    case "ArrayCombinator":
      return shouldCreateDeclaration(type.type);
    case "IntersectionCombinator":
    case "UnionCombinator":
    case "TupleCombinator":
      return type.types.some(shouldCreateDeclaration);
    case "InterfaceCombinator":
    case "TaggedUnionCombinator":
      return true;
    default:
      return false;
  }
}
