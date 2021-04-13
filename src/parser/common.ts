import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import {
  createJsonPointer,
  JsonPointer,
  JsonReference,
} from "../common/JSONReference";
import { ParsedBody } from "./body";
import { ParserRTE, readParserOutput } from "./context";
import { ParsedParameter } from "./parameter";
import { ParsedResponse } from "./response";
import { parseSchema } from "./schema";

export const JSON_MEDIA_TYPE = "application/json";
export const TEXT_PLAIN_MEDIA_TYPE = "text/plain";
export const FORM_ENCODED_MEDIA_TYPE = "application/x-www-form-urlencoded";
export const MULTIPART_FORM_MEDIA_TYPE = "multipart/form-data";

export interface ParsedItem<T> {
  _tag: "ParsedItem";
  name: string;
  item: T;
}

export function parsedItem<T>(item: T, name: string): ParsedItem<T> {
  return {
    _tag: "ParsedItem",
    name,
    item,
  };
}

export interface ParsedComponents {
  schemas: Record<string, ParsedItem<gen.TypeDeclaration>>;
  parameters: Record<string, ParsedItem<ParsedParameter>>;
  responses: Record<string, ParsedItem<ParsedResponse>>;
  requestBodies: Record<string, ParsedItem<ParsedBody>>;
}

export type ComponentType = keyof ParsedComponents;

export interface ComponentRef<T extends ComponentType> {
  _tag: "ComponentRef";
  componentType: T;
  pointer: string;
}

function componentRef<T extends ComponentType>(
  componentType: T,
  pointer: string
): ComponentRef<T> {
  return {
    _tag: "ComponentRef",
    componentType,
    pointer,
  };
}

export type ComponentRefItemType<
  C extends ComponentType
> = ParsedComponents[C][string];

export type ItemOrRef<C extends ComponentType> =
  | ComponentRefItemType<C>
  | ComponentRef<C>;

export function checkValidReference(
  componentType: ComponentType,
  pointer: JsonPointer
): E.Either<Error, JsonPointer> {
  const { tokens } = pointer;

  if (
    tokens.length === 4 &&
    tokens[1] === "components" &&
    tokens[2] === componentType
  ) {
    return E.right(pointer);
  }

  return E.left(
    new Error(
      `Cannot parse a reference to a ${componentType} not in '#/components/${componentType}'. Reference: ${pointer.toString()}`
    )
  );
}

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
