import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";
import { ParsedBodyObject } from "./body";
import { ParserRTE, readParserOutput } from "./context";
import { ParsedParameterObject } from "./parameter";
import { ParsedResponseObject } from "./response";
import { parseSchema } from "./schema";

export const JSON_MEDIA_TYPE = "application/json";

export interface GenericComponent<T> {
  _tag: "GenericComponent";
  name: string;
  object: T;
}

export function genericComponent<T>(
  name: string,
  object: T
): GenericComponent<T> {
  return {
    _tag: "GenericComponent",
    name,
    object,
  };
}

export interface SchemaComponent {
  _tag: "SchemaComponent";
  type: gen.TypeDeclaration;
}

export function schemaComponent(type: gen.TypeDeclaration): SchemaComponent {
  return { _tag: "SchemaComponent", type };
}

export interface ParsedComponents {
  schemas: Record<string, SchemaComponent>;
  parameters: Record<string, GenericComponent<ParsedParameterObject>>;
  responses: Record<string, GenericComponent<ParsedResponseObject>>;
  bodies: Record<string, GenericComponent<ParsedBodyObject>>;
}

export type ComponentType = keyof ParsedComponents;

export interface ComponentRef<T extends ComponentType> {
  _tag: "ComponentRef";
  componentType: T;
  component: ParsedComponents[T][string];
}

export interface InlineObject<T> {
  _tag: "InlineObject";
  value: T;
}

export function componentRef<T extends ComponentType>(
  componentType: T,
  component: ParsedComponents[T][string]
): ComponentRef<T> {
  return {
    _tag: "ComponentRef",
    componentType,
    component,
  };
}

export function inlineObject<T>(value: T): InlineObject<T> {
  return {
    _tag: "InlineObject",
    value,
  };
}

export function getComponentRef<T extends ComponentType>(
  componentType: T,
  pointer: string
): ParserRTE<ComponentRef<T>> {
  return pipe(
    getComponent(componentType, pointer),
    RTE.map((component) => componentRef(componentType, component))
  );
}

function getComponent<T extends ComponentType>(
  componentType: T,
  pointer: string
): ParserRTE<ParsedComponents[T][string]> {
  return pipe(
    readParserOutput(),
    RTE.map((output) => output.components[componentType][pointer]),
    RTE.chain((component) =>
      component
        ? RTE.right(component as ParsedComponents[T][string])
        : RTE.left(
            new Error(
              `Cannot get component name for componentType ${componentType}, pointer ${pointer}`
            )
          )
    )
  );
}

export function getOrCreateType(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): ParserRTE<gen.TypeDeclaration | gen.TypeReference> {
  if (JsonReference.is(schema)) {
    return pipe(
      getComponent("schemas", schema.$ref),
      RTE.map((schema) => gen.identifier(`schemas.${schema.type.name}`))
    );
  }

  return pipe(
    parseSchema(schema),
    RTE.fromEither,
    RTE.map((type) => createDeclarationOrReturnType(`${name}Schema`, type))
  );
}

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
