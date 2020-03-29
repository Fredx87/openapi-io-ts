import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { Environment, GenRTE, readParserState } from "../environment";
import { getObjectByRef, isReference, pascalCase } from "../utils";

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
): GenRTE<gen.TypeReference> {
  return pipe(
    parseSchema(schema.items),
    RTE.map(c => gen.arrayCombinator(c))
  );
}

function parseProperty(
  propName: string,
  propSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  containerSchema: OpenAPIV3.NonArraySchemaObject
): GenRTE<gen.Property> {
  return pipe(
    parseSchema(propSchema),
    RTE.map(t =>
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
): GenRTE<gen.TypeReference> {
  if (schema.properties) {
    return pipe(
      R.record.traverseWithIndex(RTE.readerTaskEither)(
        schema.properties,
        (name, prop) => parseProperty(name, prop, schema)
      ),
      RTE.map(props => gen.interfaceCombinator(Object.values(props)))
    );
  }
  return RTE.right(gen.unknownRecordType);
}

// @todo: better handling of duplicated names
function getNameForNewModel(name: string): GenRTE<string> {
  return pipe(
    readParserState(),
    RTE.map(state => {
      const res = name in state.generatedModels.namesMap ? `${name}_1` : name;
      return pascalCase(res);
    })
  );
}

function addModel(name: string, model: gen.TypeDeclaration): GenRTE<void> {
  return env =>
    TE.rightIO(
      env.parserState.modify(state => {
        const res = { ...state };
        res.generatedModels.namesMap[name] = model;
        return res;
      })
    );
}

function addModelReference(refName: string, modelName: string): GenRTE<void> {
  return env =>
    TE.rightIO(
      env.parserState.modify(state => {
        const res = { ...state };
        res.generatedModels.refNameMap[refName] = modelName;
        return res;
      })
    );
}

export function createModel(
  name: string,
  typeRef: gen.TypeReference
): GenRTE<gen.TypeReference> {
  return pipe(
    getNameForNewModel(name),
    RTE.chain(modelName =>
      pipe(
        RTE.right(gen.typeDeclaration(modelName, typeRef, true)),
        RTE.chain(t => addModel(modelName, t)),
        RTE.map(() => gen.identifier(modelName))
      )
    )
  );
}

function getModelNameFromReference(ref: OpenAPIV3.ReferenceObject): string {
  const chunks = ref.$ref.split("/");
  return chunks[chunks.length - 1];
}

function getObjectFromContext(
  ref: OpenAPIV3.ReferenceObject
): GenRTE<OpenAPIV3.SchemaObject> {
  return pipe(
    readParserState(),
    RTE.map(
      state => getObjectByRef(ref, state.document) as OpenAPIV3.SchemaObject
    )
  );
}

function createModelFromReference(
  ref: OpenAPIV3.ReferenceObject
): GenRTE<gen.TypeReference> {
  const name = getModelNameFromReference(ref);
  return pipe(
    getNameForNewModel(name),
    RTE.chain(modelName =>
      pipe(
        addModelReference(ref.$ref, modelName),
        RTE.chain(() => getObjectFromContext(ref)),
        RTE.chain(schema => parseSchema(schema)),
        RTE.chain(typeRef => createModel(name, typeRef))
      )
    )
  );
}

function getOrCreateReference(
  ref: OpenAPIV3.ReferenceObject
): GenRTE<gen.TypeReference> {
  return pipe(
    RTE.ask<Environment>(),
    RTE.chain(env => RTE.rightIO(env.parserState.read)),
    RTE.map(state =>
      O.fromNullable(state.generatedModels.refNameMap[ref.$ref])
    ),
    RTE.chain(
      O.fold(
        () => createModelFromReference(ref),
        name => RTE.right(gen.identifier(name))
      )
    )
  );
}

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  if (isReference(schema)) {
    return getOrCreateReference(schema);
  }
  switch (schema.type) {
    case "string":
      return RTE.right(parseSchemaString(schema));
    case "integer":
      return RTE.right(gen.integerType);
    case "number":
      return RTE.right(gen.numberType);
    case "boolean":
      return RTE.right(gen.booleanType);
    case "array":
      return parseSchemaArray(schema);
    case "object":
      return parseSchemaObject(schema);
  }
  return RTE.right(gen.unknownType);
}

function parseSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<void> {
  return pipe(
    A.array.traverse(RTE.readerTaskEither)(Object.keys(schemas), name => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: `#/components/schemas/${name}`
      };
      return createModelFromReference(ref);
    }),
    RTE.map(() => undefined)
  );
}

function getSchemas(): GenRTE<
  O.Option<Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>>
> {
  return pipe(
    readParserState(),
    RTE.map(state => O.fromNullable(state.document.components?.schemas))
  );
}

export function parseAllSchemas(): GenRTE<void> {
  return pipe(
    getSchemas(),
    RTE.chain(O.fold(() => RTE.right(undefined), parseSchemas))
  );
}
