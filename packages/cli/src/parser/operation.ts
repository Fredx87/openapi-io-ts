import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import { OpenAPIV3 } from "openapi-types";
import { OperationMethod } from "@openapi-io-ts/core";
import { toValidVariableName } from "../utils";
import { BodyItemOrRef, parseBody } from "./body";
import { parsedItem } from "./common";
import { modifyParserOutput, ParserContext, ParserRTE } from "./context";
import { ParameterItemOrRef, parseParameter } from "./parameter";
import { parseResponse, ResponseItemOrRef } from "./response";
import * as gen from "io-ts-codegen";

export type ParsedOperation = {
  path: string;
  method: OperationMethod;
  parameters: ParameterItemOrRef[];
  body: O.Option<BodyItemOrRef>;
  responses: Record<string, ResponseItemOrRef>;
};

export function parseAllPaths(): ParserRTE<void> {
  return pipe(
    RTE.asks((context: ParserContext) => context.document.paths),
    RTE.chain((paths) => {
      const tasks = Object.entries(paths).map(([path, pathObject]) =>
        pathObject ? parsePath(path, pathObject) : RTE.right(undefined)
      );
      return RTE.sequenceSeqArray(tasks);
    }),
    RTE.map(() => void 0)
  );
}

function parsePath(
  path: string,
  pathObject: OpenAPIV3.PathItemObject
): ParserRTE<void> {
  const operations = {
    get: pathObject?.get,
    post: pathObject?.post,
    put: pathObject?.put,
    delete: pathObject?.delete,
  };

  return pipe(
    Object.entries(operations),
    RTE.traverseSeqArray(([method, operation]) =>
      operation
        ? parseAndAddOperation(path, method as OperationMethod, operation)
        : RTE.right(undefined)
    ),
    RTE.map(() => void 0)
  );
}

function parseAndAddOperation(
  path: string,
  method: OperationMethod,
  operation: OpenAPIV3.OperationObject
): ParserRTE<void> {
  const { operationId, tags } = operation;

  if (operationId == null) {
    return RTE.left(new Error(`Missing operationId in path ${path}`));
  }

  const generatedName = toValidVariableName(operationId, "camel");

  return pipe(
    parseOperation(path, method, operation),
    RTE.chain((parsed) =>
      modifyParserOutput((draft) => {
        draft.operations[generatedName] = parsed;
      })
    ),
    RTE.chain(() => parseOperationTags(generatedName, tags))
  );
}

function parseOperation(
  path: string,
  method: OperationMethod,
  operation: OpenAPIV3.OperationObject
): ParserRTE<ParsedOperation> {
  const { operationId } = operation;

  if (operationId == null) {
    return RTE.left(
      new Error(`Missing operationId on path ${path}, method ${method}`)
    );
  }

  return pipe(
    RTE.Do,
    RTE.bind("parameters", () =>
      parseOperationParameters(operation.parameters)
    ),
    RTE.bind("body", () =>
      parseOperationBody(operation.requestBody, operationId)
    ),
    RTE.bind("responses", () =>
      parseOperationResponses(operation.responses, operationId)
    ),
    RTE.map(({ parameters, body, responses }) => {
      const operation: ParsedOperation = {
        path,
        method,
        parameters,
        body,
        responses,
      };
      return operation;
    })
  );
}

function parseOperationTags(
  operationId: string,
  tags?: string[]
): ParserRTE<void> {
  if (tags == null) {
    return RTE.right(undefined);
  }

  return pipe(
    tags,
    RTE.traverseSeqArray((tag) =>
      modifyParserOutput((draft) => {
        const currentTags = draft.tags[tag];
        draft.tags[tag] = currentTags
          ? currentTags.concat(operationId)
          : [operationId];
      })
    ),
    RTE.map(() => void 0)
  );
}

function parseOperationParameters(
  params?: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject>
): ParserRTE<ParameterItemOrRef[]> {
  if (params == null) {
    return RTE.right([]);
  }

  return pipe(
    params,
    RTE.traverseSeqArray((p) => parseParameter("", p)),
    RTE.map((res) => res as ParameterItemOrRef[])
  );
}

function parseOperationBody(
  requestBody:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.RequestBodyObject
    | undefined,
  operationId: string
): ParserRTE<O.Option<BodyItemOrRef>> {
  if (requestBody == null) {
    return RTE.right(O.none);
  }

  const name = `${toValidVariableName(operationId, "pascal")}RequestBody`;

  return pipe(parseBody(name, requestBody), RTE.map(O.some));
}

function parseOperationResponses(
  responses: OpenAPIV3.ResponsesObject | undefined,
  operationId: string
): ParserRTE<Record<string, ResponseItemOrRef>> {
  if (responses == null) {
    return RTE.right({
      "2XX": parsedItem(
        { _tag: "ParsedJsonResponse", type: gen.unknownType },
        "SuccessfulResponse"
      ),
    });
  }

  return pipe(
    responses,
    R.traverseWithIndex(RTE.ApplicativeSeq)((code, response) =>
      parseResponse(
        `${toValidVariableName(operationId, "pascal")}Response${code}`,
        response
      )
    )
  );
}
