import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { ParserContext } from "./parser-context";
import { getObjectByRef, isReference, ParserSTE, pascalCase } from "./utils";

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
): ParserSTE<gen.TypeReference> {
  return pipe(
    parseSchema(schema.items),
    STE.map(c => gen.arrayCombinator(c))
  );
}

function parseProperty(
  propName: string,
  propSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  containerSchema: OpenAPIV3.NonArraySchemaObject
): ParserSTE<gen.Property> {
  return pipe(
    parseSchema(propSchema),
    STE.map(t =>
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
): ParserSTE<gen.TypeReference> {
  if (schema.properties) {
    return pipe(
      R.record.traverseWithIndex(STE.stateTaskEither)(
        schema.properties,
        (name, prop) => parseProperty(name, prop, schema)
      ),
      STE.map(props => gen.interfaceCombinator(Object.values(props)))
    );
  }
  return STE.right(gen.unknownRecordType);
}

// @todo: better handling of duplicated names
function getNameForNewModel(name: string): ParserSTE<string> {
  return STE.gets(context => {
    const res = name in context.generatedModels.namesMap ? `${name}_1` : name;
    return pascalCase(res);
  });
}

function addModel(name: string, model: gen.TypeDeclaration): ParserSTE {
  return STE.modify(context => {
    const res = { ...context };
    res.generatedModels.namesMap[name] = model;
    return res;
  });
}

function addModelReference(refName: string, modelName: string): ParserSTE {
  return STE.modify(context => {
    const res = { ...context };
    res.generatedModels.refNameMap[refName] = modelName;
    return res;
  });
}

export function createModel(
  name: string,
  typeRef: gen.TypeReference
): ParserSTE<gen.TypeReference> {
  return pipe(
    getNameForNewModel(name),
    STE.chain(modelName =>
      pipe(
        STE.right(gen.typeDeclaration(modelName, typeRef, true)),
        STE.chain<ParserContext, string, gen.TypeDeclaration, void>(t =>
          addModel(modelName, t)
        ),
        STE.map(() => gen.identifier(modelName))
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
): ParserSTE<OpenAPIV3.SchemaObject> {
  return STE.gets(
    context => getObjectByRef(ref, context.document) as OpenAPIV3.SchemaObject
  );
}

function createModelFromReference(
  ref: OpenAPIV3.ReferenceObject
): ParserSTE<gen.TypeReference> {
  const name = getModelNameFromReference(ref);
  return pipe(
    getNameForNewModel(name),
    STE.chain(modelName =>
      pipe(
        addModelReference(ref.$ref, modelName),
        STE.chain(() => getObjectFromContext(ref)),
        STE.chain(schema => parseSchema(schema)),
        STE.chain(typeRef => createModel(name, typeRef))
      )
    )
  );
}

export function parseSchema(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): ParserSTE<gen.TypeReference> {
  if (isReference(schema)) {
    return pipe(
      STE.gets<ParserContext, O.Option<string>>(context =>
        O.fromNullable(context.generatedModels.refNameMap[schema.$ref])
      ),
      STE.chain(
        O.fold(
          () => createModelFromReference(schema),
          name => STE.right(gen.identifier(name))
        )
      )
    );
  }
  switch (schema.type) {
    case "string":
      return STE.right(parseSchemaString(schema));
    case "integer":
      return STE.right(gen.integerType);
    case "number":
      return STE.right(gen.numberType);
    case "boolean":
      return STE.right(gen.booleanType);
    case "array":
      return parseSchemaArray(schema);
    case "object":
      return parseSchemaObject(schema);
  }
  return STE.right(gen.unknownType);
}

function getSchemas(): ParserSTE<
  O.Option<Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>>
> {
  return STE.gets(context =>
    O.fromNullable(context.document.components?.schemas)
  );
}

function parseSchemas(
  schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
): ParserSTE {
  return pipe(
    A.array.traverse(STE.stateTaskEither)(Object.keys(schemas), name => {
      const ref: OpenAPIV3.ReferenceObject = {
        $ref: `#/components/schemas/${name}`
      };
      return createModelFromReference(ref);
    }),
    STE.map(() => undefined)
  );
}

export function parseAllSchemas(): ParserSTE {
  return pipe(
    getSchemas(),
    STE.chain(O.fold(() => STE.right(undefined), parseSchemas))
  );
}
