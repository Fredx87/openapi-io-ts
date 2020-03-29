import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { GenRTE, readParserState } from "../environment";
import { getObjectByRef, jsonSchemaRef, pascalCase } from "../utils";

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

function createCustomCombinator(name: string): gen.CustomCombinator {
  const repr = `models.${name}`;
  return gen.customCombinator(repr, repr);
}

function parseEnum(
  name: string,
  schema: OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  return createModel(
    `${name}Enum`,
    gen.unionCombinator(schema.enum!.map(e => gen.literalCombinator(e)))
  );
}

function parseSchemaString(
  name: string,
  schema: OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  if (schema.enum) {
    return parseEnum(name, schema);
  }
  if (schema.format === "date" || schema.format === "date-time") {
    return RTE.right(createCustomCombinator("DateFromISOString"));
  }
  return RTE.right(gen.stringType);
}

function parseSchemaArray(
  name: string,
  schema: OpenAPIV3.ArraySchemaObject
): GenRTE<gen.TypeReference> {
  return pipe(
    parseSchema(`${name}Items`, schema.items),
    RTE.map(c => gen.arrayCombinator(c))
  );
}

function parseProperty(
  name: string,
  propName: string,
  propSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  containerSchema: OpenAPIV3.NonArraySchemaObject
): GenRTE<gen.Property> {
  return pipe(
    parseSchema(`${name}${pascalCase(propName)}`, propSchema),
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
  name: string,
  schema: OpenAPIV3.NonArraySchemaObject
): GenRTE<gen.TypeReference> {
  if (schema.properties) {
    return pipe(
      R.record.traverseWithIndex(RTE.readerTaskEither)(
        schema.properties,
        (propName, prop) => parseProperty(name, propName, prop, schema)
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
        RTE.map(() => createCustomCombinator(modelName))
      )
    )
  );
}

function getModelNameFromReference(ref: OpenAPIV3.ReferenceObject): string {
  const chunks = ref.$ref.split("/");
  return chunks[chunks.length - 1];
}

function getObjectFromState(ref: string): GenRTE<OpenAPIV3.SchemaObject> {
  return pipe(
    readParserState(),
    RTE.map(
      state => getObjectByRef(ref, state.document) as OpenAPIV3.SchemaObject
    )
  );
}

function createModelFromReference(
  name: string,
  ref: string
): GenRTE<gen.TypeReference> {
  return pipe(
    getNameForNewModel(name),
    RTE.chain(modelName =>
      pipe(
        addModelReference(ref, modelName),
        RTE.chain(() => getObjectFromState(ref)),
        RTE.chain(schema => parseSchema(name, schema)),
        RTE.chain(typeRef => createModel(name, typeRef))
      )
    )
  );
}

function getOrCreateReference(
  name: string,
  ref: string
): GenRTE<gen.TypeReference> {
  return pipe(
    readParserState(),
    RTE.map(state => O.fromNullable(state.generatedModels.refNameMap[ref])),
    RTE.chain(
      O.fold(
        () => createModelFromReference(name, ref),
        name => RTE.right(createCustomCombinator(name))
      )
    )
  );
}

export function parseSchema(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  if (jsonSchemaRef.is(schema)) {
    return getOrCreateReference(name, schema.$ref);
  }
  switch (schema.type) {
    case "string":
      return parseSchemaString(name, schema);
    case "integer":
      return RTE.right(gen.integerType);
    case "number":
      return RTE.right(gen.numberType);
    case "boolean":
      return RTE.right(gen.booleanType);
    case "array":
      return parseSchemaArray(name, schema);
    case "object":
      return parseSchemaObject(name, schema);
  }
  return RTE.right(gen.unknownType);
}

function parseSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<void> {
  return pipe(
    A.array.traverse(RTE.readerTaskEither)(Object.keys(schemas), name => {
      const ref = `#/components/schemas/${name}`;
      return createModelFromReference(name, ref);
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
