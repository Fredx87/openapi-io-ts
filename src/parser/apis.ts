import { sequenceS } from "fp-ts/Apply";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import produce from "immer";
import { OpenAPIV3 } from "openapi-types";
import { JSONPointerToken, JSONReference } from "../common/JSONReference";
import { getOrResolveRef } from "../utils";
import { ParserRTE, readParserState } from "./context";
import { getOrCreateModel } from "./models";
import {
  Api,
  ApiBody,
  ApiMethod,
  ApiParameter,
  ApiParameterIn,
  ApiResponse,
} from "./parserState";

const JSON_MEDIA_TYPE = "application/json";

function getObjectFromDocument<T>(
  obj: OpenAPIV3.ReferenceObject | T
): ParserRTE<T> {
  return pipe(
    readParserState(),
    RTE.map((state) => getOrResolveRef(obj, state.document))
  );
}

export function parseApiResponseObject(
  apiPointer: string,
  operation: OpenAPIV3.OperationObject,
  code: string,
  resp: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
): ParserRTE<O.Option<ApiResponse>> {
  const basePointer = JSONReference.is(resp)
    ? resp.$ref
    : `${apiPointer}/responses/${code}`;
  return pipe(
    getObjectFromDocument(resp),
    RTE.chain((r) => {
      const jsonSchema = r.content?.[JSON_MEDIA_TYPE]?.schema;

      if (jsonSchema == null) {
        return RTE.right(O.none);
      }

      const pointer = `${basePointer}/content/${JSONPointerToken.encode(
        JSON_MEDIA_TYPE
      )}/schema`;

      const modelName = `${operation.operationId!}Response${code}`;

      return pipe(
        getOrCreateModel(pointer, modelName),
        RTE.map((type) => {
          const res: ApiResponse = {
            code,
            mediaType: JSON_MEDIA_TYPE,
            type,
          };
          return O.some(res);
        })
      );
    })
  );
}

export function parseApiResponses(
  apiPointer: string,
  operation: OpenAPIV3.OperationObject
): ParserRTE<ApiResponse[]> {
  if (operation.responses == null) {
    return RTE.right([]);
  }

  const { responses } = operation;
  const tasks = Object.entries(responses).map(([code, mediaRecord]) =>
    parseApiResponseObject(apiPointer, operation, code, mediaRecord)
  );

  return pipe(
    RTE.sequenceSeqArray(tasks),
    RTE.map((res) => res.filter(O.isSome).map((o) => o.value))
  );
}

function parseRequestBodyContent(
  apiPointer: string,
  operation: OpenAPIV3.OperationObject,
  requestBody: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<O.Option<ApiBody>> {
  const basePointer = JSONReference.is(requestBody)
    ? requestBody.$ref
    : `${apiPointer}/requestBody`;

  return pipe(
    getObjectFromDocument(requestBody),
    RTE.chain((body) => {
      const jsonSchema = body.content[JSON_MEDIA_TYPE]?.schema;

      if (jsonSchema == null) {
        return RTE.right(O.none);
      }

      const pointer = `${basePointer}/content/${JSONPointerToken.encode(
        JSON_MEDIA_TYPE
      )}/schema`;

      return pipe(
        getOrCreateModel(pointer, `${operation.operationId!}RequestBody`),
        RTE.map((type) => {
          const res: ApiBody = {
            type,
            required: body.required ?? false,
          };
          return O.some(res);
        })
      );
    })
  );
}

// todo: understand how to handle not JSON bodies
function parseApiRequestBody(
  apiPointer: string,
  operation: OpenAPIV3.OperationObject
): ParserRTE<O.Option<ApiBody>> {
  return pipe(
    O.fromNullable(operation.requestBody),
    O.fold(
      () => RTE.right(O.none),
      (rb) => parseRequestBodyContent(apiPointer, operation, rb)
    )
  );
}

function createApiParameter(
  basePointer: string,
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): ParserRTE<ApiParameter> {
  const paramPointer = JSONReference.is(param) ? param.$ref : basePointer;
  return pipe(
    getObjectFromDocument(param),
    RTE.chain((resolvedParam) =>
      pipe(
        getOrCreateModel(`${paramPointer}/schema`, resolvedParam.name),
        RTE.map((type) => {
          const res: ApiParameter = {
            name: resolvedParam.name,
            type,
            in: resolvedParam.in as ApiParameterIn, // wrong type in openapi-types,
            required: resolvedParam.required || false,
          };
          return res;
        })
      )
    )
  );
}

function parseApiParameters(
  apiPointer: string,
  operation: OpenAPIV3.OperationObject
): ParserRTE<ApiParameter[]> {
  const parameters = O.fromNullable(operation.parameters);
  return pipe(
    parameters,
    O.fold(
      () => RTE.right([]),
      (params) => {
        const tasks = params.map((param, i) =>
          createApiParameter(`${apiPointer}/parameters/${i}`, param)
        );
        return RTE.sequenceSeqArray(tasks) as ParserRTE<ApiParameter[]>;
      }
    )
  );
}

function addApi(tag: string, api: Api): ParserRTE<void> {
  return (env) =>
    TE.rightIO(
      env.parserState.modify((context) =>
        produce(context, (draft) => {
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
): ParserRTE<Api> {
  const apiPointer = `#/paths/${JSONPointerToken.encode(path)}/${method}`;
  return sequenceS(RTE.readerTaskEither)({
    path: RTE.right(path),
    name: RTE.right(operation.operationId!),
    method: RTE.right(method),
    params: parseApiParameters(apiPointer, operation),
    body: parseApiRequestBody(apiPointer, operation),
    responses: parseApiResponses(apiPointer, operation),
  });
}

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): ParserRTE<void> {
  const tag = operation.tags ? operation.tags[0] : "";
  return pipe(
    createApi(path, method, operation),
    RTE.chain((api) => addApi(tag, api))
  );
}

function parseOperation(
  path: string,
  method: ApiMethod,
  operation: O.Option<OpenAPIV3.OperationObject>
): ParserRTE<void> {
  return pipe(
    operation,
    O.fold(
      () => RTE.right(undefined),
      (o) => parseApi(path, method, o)
    )
  );
}

function parsePath(
  path: string,
  pathObj?: OpenAPIV3.PathItemObject
): ParserRTE<void> {
  const operations = {
    get: O.fromNullable(pathObj?.get),
    post: O.fromNullable(pathObj?.post),
    put: O.fromNullable(pathObj?.put),
    delete: O.fromNullable(pathObj?.delete),
  } as const;

  const tasks = Object.entries(operations).map(([method, operation]) =>
    parseOperation(path, method as ApiMethod, operation)
  );

  return pipe(
    RTE.sequenceSeqArray(tasks),
    RTE.map(() => {})
  );
}

function getPaths(): ParserRTE<OpenAPIV3.PathsObject> {
  return pipe(
    readParserState(),
    RTE.map((state) => state.document.paths)
  );
}

export function parseAllApis(): ParserRTE<void> {
  return pipe(
    getPaths(),
    RTE.chain((paths) => {
      const tasks = Object.entries(paths).map(([path, pathObj]) =>
        parsePath(path, pathObj)
      );
      return RTE.sequenceSeqArray(tasks);
    }),
    RTE.map(() => {})
  );
}
