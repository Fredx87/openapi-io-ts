import * as STE from "fp-ts-contrib/lib/StateTaskEither";
import { sequenceS } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as R from "fp-ts/lib/Record";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { OpenAPIV3 } from "openapi-types";
import {
  Api,
  ApiBody,
  ApiMethod,
  ApiParameter,
  ApiParameterIn,
  ApiResponse,
  ParserContext
} from "./parser-context";
import { createModel, parseSchema, shouldGenerateModel } from "./schema-parser";
import { getObjectByRef, isReference, ParserSTE } from "./utils";

function getObjectFromDocument<T>(
  obj: OpenAPIV3.ReferenceObject | T
): ParserSTE<T> {
  return pipe(
    STE.gets((context: ParserContext) => context.document),
    STE.chain(doc =>
      isReference(obj)
        ? STE.right(getObjectByRef(obj, doc) as T)
        : STE.right(obj)
    )
  );
}

function getOrCreateModel(
  name: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined
): ParserSTE<gen.TypeReference> {
  return pipe(
    schema ? parseSchema(schema) : STE.right(gen.unknownType),
    STE.chain(s =>
      shouldGenerateModel(s) ? createModel(name, s) : STE.right(s)
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
): ParserSTE<Record<string, Record<string, OpenAPIV3.MediaTypeObject>>> {
  return pipe(
    R.record.traverse(STE.stateTaskEither)(responses, resp =>
      getObjectFromDocument(resp)
    ),
    STE.map(res => R.record.map(res, getMediaTypesWithSchema)),
    STE.map(res => R.record.filter(res, mediaObj => !R.isEmpty(mediaObj)))
  );
}

function parseMediaRecord(
  code: string,
  mediaRecord: Record<string, OpenAPIV3.MediaTypeObject>,
  operation: OpenAPIV3.OperationObject
): ParserSTE<ApiResponse[]> {
  const modelName = `${operation.operationId!}Response${code}`;
  return pipe(
    R.record.traverseWithIndex(STE.stateTaskEither)(
      mediaRecord,
      (mediaType, mediaObj) =>
        pipe(
          getOrCreateModel(modelName, mediaObj.schema),
          STE.map(type => {
            const res: ApiResponse = {
              code,
              mediaType,
              type
            };
            return res;
          })
        )
    ),
    STE.map(res => Object.values(res))
  );
}

export function parseApiResponses(
  operation: OpenAPIV3.OperationObject
): ParserSTE<ApiResponse[]> {
  return pipe(
    O.fromNullable(operation.responses),
    O.fold(
      () => STE.right([]),
      responses =>
        pipe(
          getResponsensWithContent(responses),
          STE.chain(res =>
            R.record.traverseWithIndex(STE.stateTaskEither)(
              res,
              (code, mediaRecord) =>
                parseMediaRecord(code, mediaRecord, operation)
            )
          ),
          STE.map(res => Object.values(res)),
          STE.map(res => A.flatten(res))
        )
    )
  );
}

// todo: understand how to handle not JSON bodies
function parseApiRequestBody(
  operation: OpenAPIV3.OperationObject
): ParserSTE<O.Option<ApiBody>> {
  return pipe(
    O.fromNullable(operation.requestBody),
    O.fold(
      () => STE.right(O.none),
      rb =>
        pipe(
          getObjectFromDocument(rb),
          STE.chain(body =>
            pipe(
              getJsonSchemaFromContent(body.content),
              O.fold(
                () => STE.right(O.none),
                schema =>
                  pipe(
                    getOrCreateModel(
                      `${operation.operationId!}RequestBody`,
                      schema
                    ),
                    STE.map(type => {
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
): ParserSTE<ApiParameter> {
  return pipe(
    getObjectFromDocument(param),
    STE.chain(resolvedParam =>
      pipe(
        getOrCreateModel(resolvedParam.name, resolvedParam.schema),
        STE.map(type => {
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
): ParserSTE<ApiParameter[]> {
  const parameters = O.fromNullable(operation.parameters);
  return pipe(
    parameters,
    O.fold(
      () => STE.right([]),
      p => A.array.traverse(STE.stateTaskEither)(p, createApiParameter)
    )
  );
}

function addApi(tag: string, api: Api): ParserSTE {
  return STE.modify(context =>
    produce(context, draft => {
      draft.apis[tag] ? draft.apis[tag].push(api) : (draft.apis[tag] = [api]);
    })
  );
}

function createApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): ParserSTE<Api> {
  return sequenceS(STE.stateTaskEither)({
    path: STE.right(path),
    name: STE.right(operation.operationId!),
    method: STE.right(method),
    params: parseApiParameters(operation),
    body: parseApiRequestBody(operation),
    responses: parseApiResponses(operation)
  });
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): ParserSTE {
  const tag = operation.tags ? operation.tags[0] : "";
  return pipe(
    createApi(path, method, operation),
    STE.chain(api => addApi(tag, api))
  );
}

function parseOperation(
  path: string,
  method: ApiMethod,
  operation: O.Option<OpenAPIV3.OperationObject>
): ParserSTE {
  return pipe(
    operation,
    O.fold(
      () => STE.right(undefined),
      o => parseApi(path, method, o)
    )
  );
}

function parsePath(path: string, pathObj: OpenAPIV3.PathItemObject): ParserSTE {
  const operations: Record<ApiMethod, O.Option<OpenAPIV3.OperationObject>> = {
    get: O.fromNullable(pathObj.get),
    post: O.fromNullable(pathObj.post),
    put: O.fromNullable(pathObj.put),
    delete: O.fromNullable(pathObj.delete)
  };
  return pipe(
    R.record.traverseWithIndex(STE.stateTaskEither)(
      operations,
      (method, operation) =>
        parseOperation(path, method as ApiMethod, operation)
    ),
    STE.map(() => undefined)
  );
}

function getPaths(): ParserSTE<OpenAPIV3.PathsObject> {
  return STE.gets(context => context.document.paths);
}

export function parseAllApis(): ParserSTE {
  return pipe(
    getPaths(),
    STE.chain(paths =>
      R.record.traverseWithIndex(STE.stateTaskEither)(paths, parsePath)
    ),
    STE.map(() => undefined)
  );
}
