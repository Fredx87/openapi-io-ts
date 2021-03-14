import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { JsonReference } from "../common/JSONReference";

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): E.Either<Error, gen.TypeReference> {
  if (JsonReference.is(schema)) {
    return parseJsonReference(schema.$ref);
  }

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
  const tokens = pointer.split("/");

  if (
    tokens.length === 4 &&
    tokens[1] === "components" &&
    tokens[2] === "schemas"
  ) {
    return E.right(gen.identifier(`${tokens[2]}.${tokens[3]}`));
  }

  return E.left(
    new Error(
      `Cannot parse a reference to a schema not in '#/components/schemas. Reference: ${pointer}`
    )
  );
}

function parseAllOf(
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): E.Either<Error, gen.TypeReference> {
  return pipe(
    parseSchemas(schemas),
    E.map((schemas) => gen.intersectionCombinator(schemas))
  );
}

function parseOneOf(
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): E.Either<Error, gen.TypeReference> {
  return pipe(
    parseSchemas(schemas),
    E.map((schemas) => gen.unionCombinator(schemas))
  );
}

function parseString(
  schema: OpenAPIV3.SchemaObject
): E.Either<Error, gen.TypeReference> {
  if (schema.enum) {
    return parseEnum(schema.enum);
  }

  if (schema.format === "date" || schema.format === "date-time") {
    return E.right(gen.identifier("DateFromISOString"));
  }

  return E.right(gen.stringType);
}

function parseEnum(enums: string[]): E.Either<Error, gen.TypeReference> {
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
  const tasks = schemas.map(parseSchema);
  return E.sequenceArray(tasks) as E.Either<Error, gen.TypeReference[]>;
}

function parseObject(
  schema: OpenAPIV3.NonArraySchemaObject
): E.Either<Error, gen.TypeReference> {
  if (schema.properties) {
    const tasks = Object.entries(schema.properties).map(([name, propSchema]) =>
      parseProperty(name, propSchema, schema)
    );

    return pipe(
      E.sequenceArray(tasks),
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
        parentSchema.required && !parentSchema.required.includes(name)
      )
    )
  );
}
