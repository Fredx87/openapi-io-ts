import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as S from "fp-ts/lib/State";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "./parser-context";
import { getObjectByRef, isReference, pascalCase } from "./utils";

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
  schema: OpenAPIV3.ArraySchemaObject
): S.State<ParserContext, gen.TypeReference> {
  return pipe(
    parseSchema(schema.items),
    S.map(c => gen.arrayCombinator(c))
  );
}

function parseProperty(
  propName: string,
  propSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  containerSchema: OpenAPIV3.NonArraySchemaObject
): S.State<ParserContext, gen.Property> {
  return pipe(
    parseSchema(propSchema),
    S.map(t =>
      gen.property(
        propName,
        t,
        containerSchema.required && !containerSchema.required.includes(propName)
      )
    )
  );
}

function parseSchemaObject(
  schema: OpenAPIV3.NonArraySchemaObject
): S.State<ParserContext, gen.TypeReference> {
  if (schema.properties) {
    return pipe(
      R.record.traverseWithIndex(S.state)(schema.properties, (name, prop) =>
        parseProperty(name, prop, schema)
      ),
      S.map(props => gen.interfaceCombinator(Object.values(props)))
    );
  }
  return S.of(gen.unknownRecordType);
}

// @todo: better handling of duplicated names
function getNameForNewModel(name: string): S.State<ParserContext, string> {
  return S.gets(context => {
    const res = name in context.generatedModels.namesMap ? `${name}_1` : name;
    return pascalCase(res);
  });
}

function addModel(
  name: string,
  model: gen.TypeDeclaration
): S.State<ParserContext, void> {
  return S.modify(context => {
    const res = { ...context };
    res.generatedModels.namesMap[name] = model;
    return res;
  });
}

function addModelReference(
  refName: string,
  modelName: string
): S.State<ParserContext, void> {
  return S.modify(context => {
    const res = { ...context };
    res.generatedModels.refNameMap[refName] = modelName;
    return res;
  });
}

export function createModel(
  name: string,
  typeRef: gen.TypeReference
): S.State<ParserContext, gen.TypeReference> {
  return pipe(
    getNameForNewModel(name),
    S.map(modelName => gen.typeDeclaration(modelName, typeRef, true)),
    S.chain(t => addModel(name, t)),
    S.map(_ => gen.identifier(name))
  );
}

function getModelNameFromReference(ref: OpenAPIV3.ReferenceObject): string {
  const chunks = ref.$ref.split("/");
  return chunks[chunks.length - 1];
}

function getObjectFromContext(
  ref: OpenAPIV3.ReferenceObject
): S.State<ParserContext, OpenAPIV3.SchemaObject> {
  return S.gets(
    context => getObjectByRef(ref, context.document) as OpenAPIV3.SchemaObject
  );
}

function createModelFromReference(
  ref: OpenAPIV3.ReferenceObject
): S.State<ParserContext, gen.TypeReference> {
  const name = getModelNameFromReference(ref);
  return pipe(
    getNameForNewModel(name),
    S.chain(modelName =>
      pipe(
        addModelReference(ref.$ref, modelName),
        S.chain(_ => getObjectFromContext(ref)),
        S.chain(schema => parseSchema(schema)),
        S.chain(typeRef => createModel(name, typeRef))
      )
    )
  );
}

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): S.State<ParserContext, gen.TypeReference> {
  if (isReference(schema)) {
    return pipe(
      S.gets<ParserContext, O.Option<string>>(context =>
        O.fromNullable(context.generatedModels.refNameMap[schema.$ref])
      ),
      S.chain(o =>
        pipe(
          o,
          O.fold(
            () => createModelFromReference(schema),
            name => S.of(gen.identifier(name))
          )
        )
      )
    );
  }
  switch (schema.type) {
    case "string":
      return S.of(parseSchemaString(schema));
    case "integer":
      return S.of(gen.integerType);
    case "number":
      return S.of(gen.numberType);
    case "boolean":
      return S.of(gen.booleanType);
    case "array":
      return parseSchemaArray(schema);
    case "object":
      return parseSchemaObject(schema);
  }
  return S.of(gen.unknownType);
}

function getSchemas(): S.State<
  ParserContext,
  O.Option<Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>>
> {
  return S.gets(context =>
    O.fromNullable(context.document.components?.schemas)
  );
}

function parseSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): S.State<ParserContext, void> {
  return pipe(
    A.array.traverse(S.state)(Object.keys(schemas), name => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: `#/components/schemas/${name}`
      };
      return createModelFromReference(ref);
    }),
    S.chain(() => S.modify(s => s))
  );
}

export function parseAllSchemas(): S.State<ParserContext, void> {
  return pipe(
    getSchemas(),
    S.chain(o =>
      pipe(
        o,
        O.fold(() => S.modify(s => s), parseSchemas)
      )
    )
  );
}
