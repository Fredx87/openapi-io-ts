import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { createPointer, JSONReference } from "../common/JSONReference";
import { GenRTE, readParserState } from "../environment";
import { getObjectByRef, pascalCase } from "../utils";

function modelRefCombinator(name: string): gen.CustomCombinator {
  const repr = `models.${name}`;
  return gen.customCombinator(repr, repr);
}

function getModelsNames(): GenRTE<string[]> {
  return pipe(
    readParserState(),
    RTE.map(state => Object.values(state.models).map(model => model.name))
  );
}

// @todo: better handling of duplicated names
function getNameForNewModel(name: string): GenRTE<string> {
  return pipe(
    getModelsNames(),
    RTE.map(names => {
      const res = names.includes(name) ? `${name}_1` : name;
      return pascalCase(res);
    })
  );
}

function setModel(pointer: string, model: gen.TypeDeclaration): GenRTE<void> {
  return env =>
    TE.rightIO(
      env.parserState.modify(state =>
        produce(state, draft => {
          draft.models[pointer] = model;
        })
      )
    );
}

/**
 * If a model is generated from the "#/components/schemas" section, replace it's eventually long generated name
 * with its original name
 *
 * @param pointer JSONPointer
 * @param name Generated name
 */
export function simplifyModelName(pointer: string, name: string): string {
  const matches = pointer.match(/^#\/components\/schemas\/([^\/]*)$/);
  return matches ? matches[1] : name;
}

function createNewModel(
  pointer: string,
  name: string,
  typeRef: gen.TypeReference
): GenRTE<gen.TypeReference> {
  return pipe(
    getNameForNewModel(simplifyModelName(pointer, name)),
    RTE.chain(modelName =>
      pipe(
        RTE.right(gen.typeDeclaration(modelName, typeRef, true)),
        RTE.chain(t => setModel(pointer, t)),
        RTE.map(() => modelRefCombinator(modelName))
      )
    )
  );
}

function parseEnum(
  basePointer: string,
  name: string,
  schema: OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  return createNewModel(
    basePointer,
    name,
    gen.unionCombinator(schema.enum!.map(e => gen.literalCombinator(e)))
  );
}

function parseSchemaString(
  basePointer: string,
  name: string,
  schema: OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  if (schema.enum) {
    return parseEnum(basePointer, name, schema);
  }

  if (schema.format === "date" || schema.format === "date-time") {
    return RTE.right(modelRefCombinator("DateFromISOString"));
  }

  return RTE.right(gen.stringType);
}

function parseSchemaArray(
  basePointer: string,
  name: string,
  schema: OpenAPIV3.ArraySchemaObject
): GenRTE<gen.TypeReference> {
  return pipe(
    parseSchema(
      createPointer(basePointer, "items"),
      `${name}Items`,
      schema.items
    ),
    RTE.map(t => gen.arrayCombinator(t))
  );
}

function parseProperty(
  basePointer: string,
  name: string,
  propName: string,
  propSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  containerSchema: OpenAPIV3.NonArraySchemaObject
): GenRTE<gen.Property> {
  return pipe(
    parseSchema(
      createPointer(basePointer, propName),
      `${name}${pascalCase(propName)}`,
      propSchema
    ),
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
  basePointer: string,
  name: string,
  schema: OpenAPIV3.NonArraySchemaObject
): GenRTE<gen.TypeReference> {
  // todo: parse additionalProperties
  if (schema.properties) {
    return pipe(
      R.record.traverseWithIndex(RTE.readerTaskEitherSeq)(
        schema.properties,
        (propName, prop) =>
          parseProperty(basePointer, name, propName, prop, schema)
      ),
      RTE.map(props => gen.interfaceCombinator(Object.values(props))),
      RTE.chain(t => createNewModel(basePointer, name, t))
    );
  }

  return RTE.right(gen.unknownRecordType);
}

function getObjectFromState(ref: string): GenRTE<OpenAPIV3.SchemaObject> {
  return pipe(
    readParserState(),
    RTE.map(
      state => getObjectByRef(ref, state.document) as OpenAPIV3.SchemaObject
    )
  );
}

function parseSchemas(
  basePointer: string,
  name: string,
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<gen.TypeReference[]> {
  return A.array.traverse(RTE.readerTaskEitherSeq)(schemas, schema =>
    parseSchema(createPointer(basePointer, "0"), `${name}0`, schema)
  );
}

function parseAllOf(
  basePointer: string,
  name: string,
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<gen.TypeReference> {
  return pipe(
    parseSchemas(basePointer, name, schemas),
    RTE.map(t => gen.intersectionCombinator(t)),
    RTE.chain(t => createNewModel(basePointer, name, t))
  );
}

function parseAnyOf(
  basePointer: string,
  name: string,
  schemas: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): GenRTE<gen.TypeReference> {
  return pipe(
    parseSchemas(basePointer, name, schemas),
    RTE.map(t => gen.unionCombinator(t)),
    RTE.chain(t => createNewModel(basePointer, name, t))
  );
}

export function parseSchema(
  basePointer: string,
  name: string,
  schema?: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): GenRTE<gen.TypeReference> {
  if (schema == null) {
    return RTE.right(gen.unknownType);
  }

  if (JSONReference.is(schema)) {
    return getOrCreateModel(schema.$ref, name);
  }

  if (schema.allOf) {
    return parseAllOf(basePointer, name, schema.allOf);
  }

  if (schema.anyOf) {
    return parseAnyOf(basePointer, name, schema.anyOf);
  }

  // todo: better handling of oneOf
  if (schema.oneOf) {
    return parseAnyOf(basePointer, name, schema.oneOf);
  }

  switch (schema.type) {
    case "string":
      return parseSchemaString(basePointer, name, schema);
    case "integer":
      return RTE.right(gen.integerType);
    case "number":
      return RTE.right(gen.numberType);
    case "boolean":
      return RTE.right(gen.booleanType);
    case "array":
      return parseSchemaArray(basePointer, name, schema);
    case "object":
      return parseSchemaObject(basePointer, name, schema);
  }

  return RTE.right(gen.unknownType);
}

function createModelFromPointer(
  ref: string,
  name: string
): GenRTE<gen.TypeReference> {
  return pipe(
    getNameForNewModel(name),
    RTE.chain(modelName =>
      pipe(
        getObjectFromState(ref),
        RTE.chain(schema => parseSchema(ref, modelName, schema))
      )
    )
  );
}

export function getOrCreateModel(
  pointer: string,
  name: string
): GenRTE<gen.TypeReference> {
  return pipe(
    readParserState(),
    RTE.map(state => O.fromNullable(state.models[pointer])),
    RTE.chain(model =>
      pipe(
        model,
        O.fold(
          () => createModelFromPointer(pointer, name),
          model => RTE.right(modelRefCombinator(model.name))
        )
      )
    )
  );
}
