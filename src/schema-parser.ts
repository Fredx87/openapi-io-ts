import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";

function parseSchemaString(s: OpenAPIV3.SchemaObject): gen.TypeReference {
  if (s.enum) {
    return gen.unionCombinator(s.enum.map(e => gen.literalCombinator(e)));
  }
  if (s.format === "date" || s.format === "date-time") {
    return gen.identifier("DateFromISOString");
  }
  return gen.stringType;
}

function parseSchemaArray(s: OpenAPIV3.ArraySchemaObject): gen.TypeReference {
  return gen.arrayCombinator(parseSchema(s.items));
}

function parseSchemaObject(
  s: OpenAPIV3.NonArraySchemaObject
): gen.TypeReference {
  if (s.properties) {
    return gen.interfaceCombinator(
      Object.keys(s.properties).map(p =>
        gen.property(
          p,
          parseSchema(s.properties![p]),
          s.required && !s.required.includes(p)
        )
      )
    );
  }
  return gen.unknownRecordType;
}

export function getReferenceName(
  ref: OpenAPIV3.ReferenceObject
): gen.TypeReference {
  const split = ref.$ref.split("/");
  return pipe(
    A.last(split),
    O.fold<string, gen.TypeReference>(
      () => gen.unknownType,
      t => gen.identifier(t)
    )
  );
}

export function parseSchema(
  s: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): gen.TypeReference {
  if ("$ref" in s) {
    return getReferenceName(s);
  }
  switch (s.type) {
    case "string":
      return parseSchemaString(s);
    case "integer":
      return gen.integerType;
    case "number":
      return gen.numberType;
    case "boolean":
      return gen.booleanType;
    case "array":
      return parseSchemaArray(s);
    case "object":
      return parseSchemaObject(s);
  }
  return gen.unknownType;
}
