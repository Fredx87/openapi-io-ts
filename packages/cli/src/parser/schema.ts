import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { createJsonPointer, JsonReference } from "./JSONReference";
import { toValidVariableName } from "../utils";

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): E.Either<Error, gen.TypeReference> {
  if (JsonReference.is(schema)) {
    return parseJsonReference(schema.$ref);
  }

  if (schema.nullable && schema.allOf) {
    return pipe(
      parseAllOf(schema.allOf),
      E.map((allOf) => gen.unionCombinator([allOf, gen.nullType]))
    );
  }

  return pipe(
    parseBaseSchema(schema),
    E.map((baseSchema) =>
      schema.nullable
        ? gen.unionCombinator([baseSchema, gen.nullType])
        : baseSchema
    )
  );
}

function parseBaseSchema(
  schema: OpenAPIV3.SchemaObject
): E.Either<Error, gen.TypeReference> {
  if (schema.allOf) {
    return parseAllOf(schema.allOf);
  }

  if (schema.oneOf) {
    return parseOneOf(schema.oneOf);
  }

  if (schema.anyOf) {
    return parseOneOf(schema.anyOf);
  }

  switch (schema.type) {
    case "boolean":
      return E.right(gen.booleanType);
    case "integer":
    case "number":
      return E.right(gen.numberType);
    case "string":
      return parseString(schema);
    case "array":
      return parseArray(schema);
    case "object":
      return parseObject(schema);
  }

  return E.right(gen.unknownType);
}

function parseJsonReference(
  pointer: string
): E.Either<Error, gen.TypeReference> {
  return pipe(
    createJsonPointer(pointer),
    E.map((jsonPointer) => {
      const name = `${jsonPointer.tokens[2]}.${toValidVariableName(
        jsonPointer.tokens[3],
        "pascal"
      )}`;
      return gen.customCombinator(name, name, [name]);
    })
  );
}

function parseAllOf(
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): E.Either<Error, gen.TypeReference> {
  return pipe(
    parseSchemas(schemas),
    E.map((schemas) =>
      schemas.length === 1 ? schemas[0] : gen.intersectionCombinator(schemas)
    )
  );
}

function parseOneOf(
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): E.Either<Error, gen.TypeReference> {
  return pipe(
    parseSchemas(schemas),
    E.map((schemas) =>
      schemas.length === 1 ? schemas[0] : gen.unionCombinator(schemas)
    )
  );
}

function parseString(
  schema: OpenAPIV3.SchemaObject
): E.Either<Error, gen.TypeReference> {
  if (schema.enum) {
    return parseEnum(schema.enum as string[]);
  }

  if (schema.format === "date" || schema.format === "date-time") {
    return E.right(
      gen.customCombinator("Date", "DateFromISOString", ["DateFromISOString"])
    );
  }

  return E.right(gen.stringType);
}

function parseEnum(enums: string[]): E.Either<Error, gen.TypeReference> {
  if (enums.length === 1) {
    return E.right(gen.literalCombinator(enums[0]));
  }

  const literals = enums.map((e) => gen.literalCombinator(e));
  return E.right(gen.unionCombinator(literals));
}

function parseArray(
  schema: OpenAPIV3.ArraySchemaObject
): E.Either<Error, gen.TypeReference> {
  return pipe(
    parseSchema(schema.items),
    E.map((t) => gen.arrayCombinator(t))
  );
}

function parseSchemas(
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): E.Either<Error, gen.TypeReference[]> {
  return pipe(schemas, E.traverseArray(parseSchema)) as E.Either<
    Error,
    gen.TypeReference[]
  >;
}

function parseObject(
  schema: OpenAPIV3.NonArraySchemaObject
): E.Either<Error, gen.TypeReference> {
  if (schema.properties) {
    return pipe(
      Object.entries(schema.properties),
      E.traverseArray(([name, propSchema]) =>
        parseProperty(name, propSchema, schema)
      ),
      E.map((props) => gen.typeCombinator(props as gen.Property[]))
    );
  }

  return E.right(gen.unknownRecordType);
}

function parseProperty(
  name: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  parentSchema: OpenAPIV3.NonArraySchemaObject
): E.Either<Error, gen.Property> {
  return pipe(
    parseSchema(schema),
    E.map((t) =>
      gen.property(
        name,
        t,
        parentSchema.required ? !parentSchema.required.includes(name) : true
      )
    )
  );
}
