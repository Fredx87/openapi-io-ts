import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ParseSchemaContext } from "./ParseSchemaContext";

export type ParseSchemaRTE<
  A = gen.TypeReference,
  E = Error
> = RTE.ReaderTaskEither<ParseSchemaContext, E, A>;

export type ParsableDocument =
  | OpenAPIV3_1.Document
  | OpenAPIV3.Document
  | SchemaObject;

export type SchemaObject = OpenAPIV3_1.SchemaObject;

export type ReferenceObject = OpenAPIV3_1.ReferenceObject;

export type ArraySchemaObject = OpenAPIV3_1.ArraySchemaObject;

export type NonArraySchemaObject = OpenAPIV3_1.NonArraySchemaObject;

export type SchemaOrRef = SchemaObject | ReferenceObject;

export type SchemaType =
  | OpenAPIV3_1.ArraySchemaObjectType
  | OpenAPIV3_1.NonArraySchemaObjectType;
