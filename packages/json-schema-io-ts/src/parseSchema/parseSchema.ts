import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { createJsonPointer, JsonReference } from "../JsonReference";
import { ArraySchemaObject, SchemaOrRef, SchemaObject } from "../types";
import { parseJsonReference } from "./parseJsonReference";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { resolveSchema } from "./resolveSchema";
import { addModelToResultIfNeeded } from "./addModelToResult";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { NonArraySchemaObject, SchemaType } from "..";

export function parseSchema(pointer: string): ParseSchemaRTE {
  return pipe(
    RTE.Do,
    RTE.bind("jsonPointer", () =>
      pipe(createJsonPointer(pointer), RTE.fromEither)
    ),
    RTE.bind("schema", ({ jsonPointer }) => resolveSchema(jsonPointer)),
    RTE.bind("type", ({ schema }) => parseResolvedSchema(schema)),
    RTE.chainFirst(({ type }) => addModelToResultIfNeeded(pointer, type)),
    RTE.map(({ type }) => type)
  );
}

function parseResolvedSchema(schema: SchemaOrRef): ParseSchemaRTE {
  if (JsonReference.is(schema)) {
    return parseJsonReference(schema.$ref);
  }

  const converted = convertSchemaToOpenApi3_1(schema);

  if (converted.allOf) {
    return parseAllOf(converted.allOf);
  }

  if (converted.oneOf) {
    return parseOneOf(converted.oneOf);
  }

  if (converted.anyOf) {
    return parseOneOf(converted.anyOf);
  }

  return parseSchemaByTypes(schema);
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

function parseAllOf(schemas: SchemaOrRef[]): ParseSchemaRTE {
  return pipe(
    parseSchemas(schemas),
    RTE.map((schemas) => gen.intersectionCombinator(schemas))
  );
}

function parseOneOf(schemas: SchemaOrRef[]): ParseSchemaRTE {
  return pipe(
    parseSchemas(schemas),
    RTE.map((schemas) => gen.unionCombinator(schemas))
  );
}

function parseSchemaByTypes(schema: SchemaObject): ParseSchemaRTE {
  const types =
    schema.type != null
      ? Array.isArray(schema.type)
        ? schema.type
        : [schema.type]
      : [];

  return pipe(
    types,
    RTE.traverseSeqArray((type) => parseSchemaByType(schema, type)),
    RTE.map((res) => [...res]),
    RTE.map(A.compact),
    RTE.map((res) => {
      if (res.length === 0) {
        return gen.unknownType;
      }

      if (res.length === 1) {
        return res[0];
      }

      return gen.unionCombinator(res);
    })
  );
}

function parseSchemaByType(
  schema: SchemaObject,
  type: SchemaType
): ParseSchemaRTE<O.Option<gen.TypeReference>> {
  switch (type) {
    case "boolean":
      return RTE.right(O.some(gen.booleanType));
    case "integer":
    case "number":
      return RTE.right(O.some(gen.numberType));
    case "null":
      return RTE.right(O.some(gen.nullType));
    case "string":
      return pipe(parseString(schema), RTE.map(O.some));
    case "array":
      return pipe(
        parseArray((schema as ArraySchemaObject).items),
        RTE.map(O.some)
      );
    case "object":
      return pipe(parseObject(schema as NonArraySchemaObject), RTE.map(O.some));
    default:
      return RTE.right(O.none);
  }
}

function parseString(schema: SchemaObject): ParseSchemaRTE {
  if (schema.enum) {
    return parseEnum(schema.enum as string[]);
  }

  if (schema.format === "date" || schema.format === "date-time") {
    return RTE.right(gen.customCombinator("Date", "tTypes.DateFromISOString"));
  }

  return RTE.right(gen.stringType);
}

function parseEnum(enums: string[]): ParseSchemaRTE {
  if (enums.length === 1) {
    return RTE.right(gen.literalCombinator(enums[0]));
  }

  const literals = enums.map((e) => gen.literalCombinator(e));
  return RTE.right(gen.unionCombinator(literals));
}

function parseArray(items: ArraySchemaObject["items"]): ParseSchemaRTE {
  return pipe(
    parseResolvedSchema(items),
    RTE.map((t) => gen.arrayCombinator(t))
  );
}

function parseSchemas(
  schemas: SchemaOrRef[]
): ParseSchemaRTE<gen.TypeReference[]> {
  return pipe(
    schemas,
    RTE.traverseArray(parseResolvedSchema),
    RTE.map((res) => [...res])
  );
}

function parseObject(schema: NonArraySchemaObject): ParseSchemaRTE {
  if (schema.properties) {
    return pipe(
      Object.entries(schema.properties),
      RTE.traverseArray(([name, propSchema]) =>
        parseProperty(name, propSchema, schema)
      ),
      RTE.map((props) => gen.typeCombinator([...props]))
    );
  }

  return RTE.right(gen.unknownRecordType);
}

function parseProperty(
  name: string,
  schema: SchemaOrRef,
  parentSchema: NonArraySchemaObject
): ParseSchemaRTE<gen.Property> {
  return pipe(
    parseResolvedSchema(schema),
    RTE.map((t) =>
      gen.property(
        name,
        t,
        parentSchema.required ? !parentSchema.required.includes(name) : true
      )
    )
  );
}
