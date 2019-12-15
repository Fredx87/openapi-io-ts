import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import * as S from "fp-ts/lib/State";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import {
  Api,
  ApiBody,
  ApiMethod,
  ApiParameter,
  ApiParameterIn,
  ParserContext
} from "./parser-context";
import { createModel, parseSchema, shouldGenerateModel } from "./schema-parser";
import { getObjectByRef, isReference } from "./utils";

type ObjectWithSchemas = OpenAPIV3.ParameterObject | OpenAPIV3.MediaTypeObject;

function getObjectFromDocument<T>(
  obj: OpenAPIV3.ReferenceObject | T
): S.State<ParserContext, T> {
  return pipe(
    S.gets((context: ParserContext) => context.document),
    S.chain(doc =>
      isReference(obj) ? S.of(getObjectByRef(obj, doc) as T) : S.of(obj)
    )
  );
}

function getOrCreateModel(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined
): S.State<ParserContext, gen.TypeReference> {
  return pipe(
    schema ? parseSchema(schema) : S.of(gen.unknownType),
    S.chain(s => (shouldGenerateModel(s) ? createModel(name, s) : S.of(s)))
  );
}

function getJsonSchemaFromContent(
  content: Record<string, OpenAPIV3.MediaTypeObject>
): O.Option<OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> {
  return pipe(
    R.lookup("application/json", content),
    O.chain(media => O.fromNullable(media.schema))
  );
}

// todo: understand how to handle not JSON bodies
function parseApiRequestBody(
  operation: OpenAPIV3.OperationObject
): S.State<ParserContext, O.Option<ApiBody>> {
  return pipe(
    O.fromNullable(operation.requestBody),
    O.fold(
      () => S.of(O.none),
      rb =>
        pipe(
          getObjectFromDocument(rb),
          S.chain(body =>
            pipe(
              getJsonSchemaFromContent(body.content),
              O.fold(
                () => S.of(O.none),
                schema =>
                  pipe(
                    getOrCreateModel(
                      `${operation.operationId!}RequestBody`,
                      schema
                    ),
                    S.chain(type => {
                      const res: ApiBody = {
                        type,
                        required: body.required ?? false
                      };
                      return S.of(O.some(res));
                    })
                  )
              )
            )
          )
        )
    )
  );
}

function createApiParameter(
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): S.State<ParserContext, ApiParameter> {
  return pipe(
    getObjectFromDocument(param),
    S.chain(resolvedParam =>
      pipe(
        getOrCreateModel(resolvedParam.name, resolvedParam.schema),
        S.chain(type => {
          const res: ApiParameter = {
            name: resolvedParam.name,
            type,
            in: resolvedParam.in as ApiParameterIn, // wrong type in openapi-types,
            required: resolvedParam.required || false
          };
          return S.of(res);
        })
      )
    )
  );
}

function parseApiParameters(
  operation: OpenAPIV3.OperationObject
): S.State<ParserContext, ApiParameter[]> {
  const parameters = O.fromNullable(operation.parameters);
  return pipe(
    parameters,
    O.fold(
      () => S.of([]),
      p => A.array.traverse(S.state)(p, createApiParameter)
    )
  );
}

function addApi(tag: string, api: Api): S.State<ParserContext, void> {
  return S.modify(context =>
    produce(context, draft => {
      draft.apis[tag] ? draft.apis[tag].push(api) : (draft.apis[tag] = [api]);
    })
  );
}

function createApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): S.State<ParserContext, Api> {
  return sequenceS(S.state)({
    path: S.of(path),
    name: S.of(operation.operationId!),
    method: S.of(method),
    params: parseApiParameters(operation),
    body: parseApiRequestBody(operation)
  });
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): S.State<ParserContext, void> {
  const tag = operation.tags ? operation.tags[0] : "";
  return pipe(
    createApi(path, method, operation),
    S.chain(api => addApi(tag, api))
  );
}

function parseOperation(
  path: string,
  method: ApiMethod,
  operation: O.Option<OpenAPIV3.OperationObject>
): S.State<ParserContext, void> {
  return pipe(
    operation,
    O.fold(
      () => S.modify(s => s),
      o => parseApi(path, method, o)
    )
  );
}

function parsePath(
  path: string,
  pathObj: OpenAPIV3.PathItemObject
): S.State<ParserContext, void> {
  const operations: Record<ApiMethod, O.Option<OpenAPIV3.OperationObject>> = {
    get: O.fromNullable(pathObj.get),
    post: O.fromNullable(pathObj.post),
    put: O.fromNullable(pathObj.put),
    delete: O.fromNullable(pathObj.delete)
  };
  return pipe(
    R.record.traverseWithIndex(S.state)(operations, (method, operation) =>
      parseOperation(path, method as ApiMethod, operation)
    ),
    S.chain(() => S.modify(s => s))
  );
}

function getPaths(): S.State<ParserContext, OpenAPIV3.PathsObject> {
  return S.gets(context => context.document.paths);
}

export function parseAllApis(): S.State<ParserContext, void> {
  return pipe(
    getPaths(),
    S.chain(paths => R.record.traverseWithIndex(S.state)(paths, parsePath)),
    S.chain(() => S.modify(s => s))
  );
}
