import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { JsonReference, JsonSchemaRef } from "../jsonReference";
import { generateModel } from "./generateModel";
import { parseJsonReference } from "./parseJsonReference";
import {
  resolveReferenceFromContext,
  resolveStringReference,
} from "./resolvers";
import {
  ArraySchemaObject,
  NonArraySchemaObject,
  ParseResolvedSchemaResult,
  ParseSchemaRTE,
  SchemaObject,
  SchemaOrRef,
  SchemaType,
} from "./types";

export function parseSchema(
  reference: string
): ParseSchemaRTE<gen.TypeReference> {
  return pipe(
    resolveStringReference(reference),
    RTE.chain((jsonReference) =>
      parseSchemaFromJsonReference(jsonReference, [jsonReference])
    ),
    RTE.map(({ typeReference }) => typeReference)
  );
}

export function parseSchemaFromJsonReference(
  jsonReference: JsonReference,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    RTE.Do,
    RTE.bind("schema", () => resolveReferenceFromContext(jsonReference)),
    RTE.bind("parseSchemaRes", ({ schema }) =>
      parseResolvedSchema(schema, visitedReferences)
    ),
    RTE.bind("model", ({ parseSchemaRes: { typeReference, isRecursive } }) =>
      generateModel(jsonReference, typeReference, isRecursive)
    ),
    RTE.map(
      ({ parseSchemaRes, model }): ParseResolvedSchemaResult => ({
        isRecursive: parseSchemaRes.isRecursive,
        typeReference: model,
      })
    )
  );
}

function parseResolvedSchema(
  schema: SchemaOrRef,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  if (JsonSchemaRef.is(schema)) {
    return parseJsonReference(schema.$ref, visitedReferences);
  }

  const converted = convertSchemaToOpenApi3_1(schema);

  if (converted.allOf) {
    return parseAllOf(converted.allOf, visitedReferences);
  }

  if (converted.oneOf) {
    return parseOneOf(converted.oneOf, visitedReferences);
  }

  if (converted.anyOf) {
    return parseOneOf(converted.anyOf, visitedReferences);
  }

  return parseSchemaByTypes(converted, visitedReferences);
}

function convertSchemaToOpenApi3_1(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject
): SchemaObject {
  const castedSchema = schema as OpenAPIV3.SchemaObject;

  if (castedSchema.nullable && castedSchema.type) {
    return {
      ...schema,
      type: [castedSchema.type, "null"],
    };
  }

  return schema;
}

function parseAllOf(
  schemas: SchemaOrRef[],
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    parseSchemas(schemas, visitedReferences),
    RTE.map((res) => ({
      isRecursive: res.isRecursive,
      typeReference: gen.intersectionCombinator(res.typeReferences),
    }))
  );
}

function parseOneOf(
  schemas: SchemaOrRef[],
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    parseSchemas(schemas, visitedReferences),
    RTE.map((res) => ({
      isRecursive: res.isRecursive,
      typeReference: gen.unionCombinator(res.typeReferences),
    }))
  );
}

function parseSchemaByTypes(
  schema: SchemaObject,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  const types =
    schema.type != null
      ? Array.isArray(schema.type)
        ? schema.type
        : [schema.type]
      : [];

  return pipe(
    types,
    RTE.traverseSeqArray((type) =>
      parseSchemaByType(schema, type, visitedReferences)
    ),
    RTE.map((res) => [...res]),
    RTE.map(A.compact),
    RTE.map((res) => {
      if (res.length === 0) {
        return { isRecursive: false, typeReference: gen.unknownType };
      }

      if (res.length === 1) {
        return {
          isRecursive: res[0].isRecursive,
          typeReference: res[0].typeReference,
        };
      }

      const isRecursive = res.some((r) => r.isRecursive);

      return {
        isRecursive: isRecursive,
        typeReference: gen.unionCombinator(res.map((r) => r.typeReference)),
      };
    })
  );
}

function parseSchemaByType(
  schema: SchemaObject,
  type: SchemaType,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<O.Option<ParseResolvedSchemaResult>> {
  switch (type) {
    case "boolean":
      return RTE.right(O.some(nonRecursiveType(gen.booleanType)));
    case "integer":
    case "number":
      return RTE.right(O.some(nonRecursiveType(gen.numberType)));
    case "null":
      return RTE.right(O.some(nonRecursiveType(gen.nullType)));
    case "string":
      return pipe(
        parseString(schema),
        RTE.map((type) => O.some(nonRecursiveType(type)))
      );
    case "array":
      return pipe(
        parseArray((schema as ArraySchemaObject).items, visitedReferences),
        RTE.map(O.some)
      );
    case "object":
      return pipe(
        parseObject(schema as NonArraySchemaObject, visitedReferences),
        RTE.map(O.some)
      );
    default:
      return RTE.right(O.none);
  }
}

function parseString(schema: SchemaObject): ParseSchemaRTE<gen.TypeReference> {
  if (schema.enum) {
    return parseEnum(schema.enum as string[]);
  }

  if (schema.format === "date" || schema.format === "date-time") {
    return RTE.right(
      gen.importedIdentifier("DateFromIsoString", "io-ts-types")
    );
  }

  return RTE.right(gen.stringType);
}

function parseEnum(enums: string[]): ParseSchemaRTE<gen.TypeReference> {
  if (enums.length === 1) {
    return RTE.right(gen.literalCombinator(enums[0]));
  }

  const literals = enums.map((e) => gen.literalCombinator(e));
  return RTE.right(gen.unionCombinator(literals));
}

function parseArray(
  items: ArraySchemaObject["items"],
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  return pipe(
    parseResolvedSchema(items, visitedReferences),
    RTE.map(
      (res): ParseResolvedSchemaResult => ({
        isRecursive: res.isRecursive,
        typeReference: gen.arrayCombinator(res.typeReference),
      })
    )
  );
}

interface ParseMultipleSchemasResult {
  isRecursive: boolean;
  typeReferences: gen.TypeReference[];
}

function parseSchemas(
  schemas: SchemaOrRef[],
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseMultipleSchemasResult> {
  return pipe(
    schemas,
    RTE.traverseSeqArray((s) => parseResolvedSchema(s, visitedReferences)),
    RTE.map((res) => {
      const isRecursive = res.some((r) => r.isRecursive);
      return {
        isRecursive: isRecursive,
        typeReferences: res.map((r) => r.typeReference),
      };
    })
  );
}

function parseObject(
  schema: NonArraySchemaObject,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParseResolvedSchemaResult> {
  if (schema.properties) {
    return pipe(
      Object.entries(schema.properties),
      RTE.traverseSeqArray(([name, propSchema]) =>
        parseProperty(name, propSchema, schema, visitedReferences)
      ),
      RTE.map((props) => {
        const isRecursive = props.some((p) => p.isRecursive);
        return {
          isRecursive,
          typeReference: gen.typeCombinator(props.map((p) => p.property)),
        };
      })
    );
  }

  return RTE.right({
    isRecursive: false,
    typeReference: gen.unknownRecordType,
  });
}

export interface ParsePropertyResult {
  isRecursive: boolean;
  property: gen.Property;
}

function parseProperty(
  name: string,
  schema: SchemaOrRef,
  parentSchema: NonArraySchemaObject,
  visitedReferences: JsonReference[]
): ParseSchemaRTE<ParsePropertyResult> {
  return pipe(
    parseResolvedSchema(schema, visitedReferences),
    RTE.map(({ isRecursive, typeReference }) => {
      return {
        isRecursive,
        property: gen.property(
          name,
          typeReference,
          parentSchema.required ? !parentSchema.required.includes(name) : true
        ),
      };
    })
  );
}

function nonRecursiveType(
  typeReference: gen.TypeReference
): ParseResolvedSchemaResult {
  return {
    typeReference,
    isRecursive: false,
  };
}
