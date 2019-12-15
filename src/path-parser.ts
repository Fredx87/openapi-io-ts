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
  ApiMethod,
  ApiParameter,
  ApiParameterIn,
  ParserContext
} from "./parser-context";
import { createModel, parseSchema, shouldGenerateModel } from "./schema-parser";
import { getObjectByRef, isReference } from "./utils";

function createApiParameter(
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): S.State<ParserContext, ApiParameter> {
  return pipe(
    S.gets((context: ParserContext) =>
      isReference(param)
        ? (getObjectByRef(param, context.document) as OpenAPIV3.ParameterObject)
        : param
    ),
    S.chain(resolvedParam =>
      pipe(
        resolvedParam.schema
          ? parseSchema(resolvedParam.schema)
          : S.of(gen.unknownType),
        S.chain((s: gen.TypeReference) =>
          shouldGenerateModel(s) ? createModel(resolvedParam.name, s) : S.of(s)
        ),
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

export function parseApi(
  path: string,
  method: ApiMethod,
  operation: OpenAPIV3.OperationObject
): S.State<ParserContext, void> {
  return pipe(
    parseApiParameters(operation),
    S.chain(params => {
      const api: Api = {
        path,
        name: operation.operationId!,
        method,
        params
      };
      const tag = operation.tags ? operation.tags[0] : "";
      return addApi(tag, api);
    })
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
