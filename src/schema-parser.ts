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
  return gen.arrayCombinator(parseSchema(s.items as OpenAPIV3.SchemaObject));
}

function parseSchemaObject(
  s: OpenAPIV3.NonArraySchemaObject
): gen.TypeReference {
  if (s.properties) {
    return gen.interfaceCombinator(
      Object.keys(s.properties).map(p =>
        gen.property(
          p,
          parseSchema(s.properties![p] as OpenAPIV3.SchemaObject),
          s.required && !s.required.includes(p)
        )
      )
    );
  }
  return gen.unknownRecordType;
}

export function parseSchema(s: OpenAPIV3.SchemaObject): gen.TypeReference {
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
