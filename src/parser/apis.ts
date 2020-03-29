import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import { GenRTE } from "../environment";
import { getObjectByRef, isReference } from "../utils";
import {
  Api,
  ApiBody,
  ApiMethod,
  ApiParameter,
  ApiParameterIn,
  ApiResponse
} from "./parserState";
import { createModel, parseSchema, shouldGenerateModel } from "./schemas";

function getObjectFromDocument<T>(
  obj: OpenAPIV3.ReferenceObject | T
): GenRTE<T> {
  return env =>
    pipe(
      TE.rightIO(env.parserState.read),
      TE.map(state =>
        isReference(obj) ? getObjectByRef(obj, state.document) : obj
      )
    );
}

function getOrCreateModel(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined
): GenRTE<gen.TypeReference> {
  return pipe(
    schema ? parseSchema(schema) : RTE.right(gen.unknownType),
    RTE.chain(s =>
      shouldGenerateModel(s) ? createModel(name, s) : RTE.right(s)
    )
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

function getMediaTypesWithSchema(
  response: OpenAPIV3.ResponseObject
): Record<string, OpenAPIV3.MediaTypeObject> {
  if (response.content == null) {
    return {};
  }
  return R.record.filterWithIndex(
    response.content,
    (mediaType, object) =>
      mediaType === "application/json" && object.schema != null
  );
}

function getResponsensWithContent(
  responses: OpenAPIV3.ResponsesObject
): GenRTE<Record<string, Record<string, OpenAPIV3.MediaTypeObject>>> {
  return pipe(
    R.record.traverse(RTE.readerTaskEither)(responses, resp =>
      getObjectFromDocument(resp)
    ),
    RTE.map(res => R.record.map(res, getMediaTypesWithSchema)),
    RTE.map(res => R.record.filter(res, mediaObj => !R.isEmpty(mediaObj)))
  );
}

function parseMediaRecord(
  code: string,
  mediaRecord: Record<string, OpenAPIV3.MediaTypeObject>,
  operation: OpenAPIV3.OperationObject
): GenRTE<ApiResponse[]> {
  const modelName = `${operation.operationId!}Response${code}`;
  return pipe(
    R.record.traverseWithIndex(RTE.readerTaskEither)(
      mediaRecord,
      (mediaType, mediaObj) =>
        pipe(
          getOrCreateModel(modelName, mediaObj.schema),
          RTE.map(type => {
            const res: ApiResponse = {
              code,
              mediaType,
              type
            };
            return res;
          })
        )
    ),
    RTE.map(res => Object.values(res))
  );
}

export function parseApiResponses(
  operation: OpenAPIV3.OperationObject
): GenRTE<ApiResponse[]> {
  return pipe(
    O.fromNullable(operation.responses),
    O.fold(
      () => RTE.right([]),
      responses =>
        pipe(
          getResponsensWithContent(responses),
          RTE.chain(res =>
            R.record.traverseWithIndex(RTE.readerTaskEither)(
              res,
              (code, mediaRecord) =>
                parseMediaRecord(code, mediaRecord, operation)
            )
          ),
          RTE.map(res => Object.values(res)),
          RTE.map(res => A.flatten(res))
        )
    )
  );
}

// todo: understand how to handle not JSON bodies
function parseApiRequestBody(
  operation: OpenAPIV3.OperationObject
): GenRTE<O.Option<ApiBody>> {
  return pipe(
    O.fromNullable(operation.requestBody),
    O.fold(
      () => RTE.right(O.none),
      rb =>
        pipe(
          getObjectFromDocument(rb),
          RTE.chain(body =>
            pipe(
              getJsonSchemaFromContent(body.content),
              O.fold(
                () => RTE.right(O.none),
                schema =>
                  pipe(
                    getOrCreateModel(
                      `${operation.operationId!}RequestBody`,
                      schema
                    ),
                    RTE.map(type => {
                      const res: ApiBody = {
                        type,
                        required: body.required ?? false
                      };
                      return O.some(res);
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
): GenRTE<ApiParameter> {
  return pipe(
    getObjectFromDocument(param),
    RTE.chain(resolvedParam =>
      pipe(
        getOrCreateModel(resolvedParam.name, resolvedParam.schema),
        RTE.map(type => {
          const res: ApiParameter = {
            name: resolvedParam.name,
            type,
            in: resolvedParam.in as ApiParameterIn, // wrong type in openapi-types,
            required: resolvedParam.required || false
          };
          return res;
        })
      )
    )
  );
}

function parseApiParameters(
  operation: OpenAPIV3.OperationObject
): GenRTE<ApiParameter[]> {
  const parameters = O.fromNullable(operation.parameters);
  return pipe(
    parameters,
    O.fold(
      () => RTE.right([]),
      p => A.array.traverse(RTE.readerTaskEither)(p, createApiParameter)
    )
  );
}

function addApi(tag: string, api: Api): GenRTE<void> {
  return env =>
    TE.rightIO(
      env.parserState.modify(context =>
        produce(context, draft => {
          draft.apis[tag]
            ? draft.apis[tag].push(api)
            : (draft.apis[tag] = [api]);
        })
      )
    );
}

function createApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): GenRTE<Api> {
  return sequenceS(RTE.readerTaskEither)({
    path: RTE.right(path),
    name: RTE.right(operation.operationId!),
    method: RTE.right(method),
    params: parseApiParameters(operation),
    body: parseApiRequestBody(operation),
    responses: parseApiResponses(operation)
  });
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): GenRTE<void> {
  const tag = operation.tags ? operation.tags[0] : "";
  return pipe(
    createApi(path, method, operation),
    RTE.chain(api => addApi(tag, api))
  );
}

function parseOperation(
  path: string,
  method: ApiMethod,
  operation: O.Option<OpenAPIV3.OperationObject>
): GenRTE<void> {
  return pipe(
    operation,
    O.fold(
      () => RTE.right(undefined),
      o => parseApi(path, method, o)
    )
  );
}

function parsePath(
  path: string,
  pathObj: OpenAPIV3.PathItemObject
): GenRTE<void> {
  const operations: Record<ApiMethod, O.Option<OpenAPIV3.OperationObject>> = {
    get: O.fromNullable(pathObj.get),
    post: O.fromNullable(pathObj.post),
    put: O.fromNullable(pathObj.put),
    delete: O.fromNullable(pathObj.delete)
  };
  return pipe(
    R.record.traverseWithIndex(RTE.readerTaskEither)(
      operations,
      (method, operation) =>
        parseOperation(path, method as ApiMethod, operation)
    ),
    RTE.map(() => undefined)
  );
}

function getPaths(): GenRTE<OpenAPIV3.PathsObject> {
  return env =>
    pipe(
      TE.rightIO(env.parserState.read),
      TE.map(state => state.document.paths)
    );
}

export function parseAllApis(): GenRTE<void> {
  return pipe(
    getPaths(),
    RTE.chain(paths =>
      R.record.traverseWithIndex(RTE.readerTaskEither)(paths, parsePath)
    ),
    RTE.map(() => undefined)
  );
}
