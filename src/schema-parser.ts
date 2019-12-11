import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "./parser";
import { getObjectByRef, isReference, pascalCase } from "./utils";

export interface GeneratedModels {
  namesMap: Record<string, gen.TypeDeclaration>;
  refNameMap: Record<string, string>;
}

// @todo: extends with allOf, oneOf and other missing types
export function shouldGenerateModel(typeRef: gen.TypeReference): boolean {
  switch (typeRef.kind) {
    case "InterfaceCombinator":
      return true;
    case "ArrayCombinator":
      return shouldGenerateModel(typeRef.type);
    case "IntersectionCombinator":
    case "UnionCombinator":
      return typeRef.types.some(shouldGenerateModel);
    default:
      return false;
  }
}

function parseSchemaString(schema: OpenAPIV3.SchemaObject): gen.TypeReference {
  if (schema.enum) {
    return gen.unionCombinator(schema.enum.map(e => gen.literalCombinator(e)));
  }
  if (schema.format === "date" || schema.format === "date-time") {
    return gen.identifier("DateFromISOString");
  }
  return gen.stringType;
}

function parseSchemaArray(
  schema: OpenAPIV3.ArraySchemaObject,
  context: ParserContext
): gen.TypeReference {
  return gen.arrayCombinator(parseSchema(schema.items, context));
}

function parseSchemaObject(
  schema: OpenAPIV3.NonArraySchemaObject,
  context: ParserContext
): gen.TypeReference {
  if (schema.properties) {
    return gen.interfaceCombinator(
      Object.keys(schema.properties).map(p =>
        gen.property(
          p,
          parseSchema(schema.properties![p], context),
          schema.required && !schema.required.includes(p)
        )
      )
    );
  }
  return gen.unknownRecordType;
}

// @todo: better handling of duplicated names
function getNameForNewModel(name: string, context: ParserContext): string {
  const res = name in context.generatedModels.namesMap ? `${name}_1` : name;
  return pascalCase(res);
}

export function createModel(
  name: string,
  typeRef: gen.TypeReference,
  context: ParserContext
): gen.TypeReference {
  const modelName = getNameForNewModel(name, context);
  context.generatedModels.namesMap[modelName] = gen.typeDeclaration(
    modelName,
    typeRef,
    true
  );
  return gen.identifier(modelName);
}

function getModelNameFromReference(ref: OpenAPIV3.ReferenceObject): string {
  const chunks = ref.$ref.split("/");
  return chunks[chunks.length - 1];
}

function createModelFromReference(
  ref: OpenAPIV3.ReferenceObject,
  context: ParserContext
): gen.TypeReference {
  const schema = getObjectByRef(
    ref,
    context.document
  ) as OpenAPIV3.SchemaObject;
  const name = getModelNameFromReference(ref);
  const modelName = getNameForNewModel(name, context);
  const parsedSchema = parseSchema(schema, context);
  context.generatedModels.refNameMap[ref.$ref] = modelName;
  return createModel(modelName, parsedSchema, context);
}

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  context: ParserContext
): gen.TypeReference {
  if (isReference(schema)) {
    const modelName = context.generatedModels.refNameMap[schema.$ref];
    return modelName
      ? gen.identifier(modelName)
      : createModelFromReference(schema, context);
  }
  switch (schema.type) {
    case "string":
      return parseSchemaString(schema);
    case "integer":
      return gen.integerType;
    case "number":
      return gen.numberType;
    case "boolean":
      return gen.booleanType;
    case "array":
      return parseSchemaArray(schema, context);
    case "object":
      return parseSchemaObject(schema, context);
  }
  return gen.unknownType;
}

export function parseAllSchemas(context: ParserContext): void {
  const { components } = context.document;

  if (!components) {
    return;
  }

  const { schemas } = components;

  if (schemas) {
    for (const name of Object.keys(schemas)) {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: `#/components/schemas/${name}`
      };
      createModelFromReference(ref, context);
    }
  }
}
