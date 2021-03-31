import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import { OpenAPIV3 } from "openapi-types";
import { toValidVariableName } from "../common/utils";
import { BodyItemOrRef, parseBody } from "./body";
import { parsedItem } from "./common";
import { modifyParserOutput, ParserContext, ParserRTE } from "./context";
import { ParameterItemOrRef, parseParameter } from "./parameter";
import { parseResponse, ResponseItemOrRef } from "./response";

type OperationMethod = "get" | "post" | "put" | "delete";

export interface OperationResponses {
  success: ResponseItemOrRef;
  errors: Record<string, ResponseItemOrRef>;
}

export type ParsedOperation = {
  path: string;
  method: OperationMethod;
  parameters: ParameterItemOrRef[];
  body: O.Option<BodyItemOrRef>;
  responses: OperationResponses;
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
  return pipe(
    RTE.Do,
    RTE.bind("parameters", () =>
      parseOperationParameters(operation.parameters)
    ),
    RTE.bind("body", () => parseOperationBody(operation.requestBody)),
    RTE.bind("responses", () => parseOperationResponses(operation.responses)),
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
    RTE.traverseSeqArray(parseParameter),
    RTE.map((res) => res as ParameterItemOrRef[])
  );
}

function parseOperationBody(
  requestBody?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
): ParserRTE<O.Option<BodyItemOrRef>> {
  if (requestBody == null) {
    return RTE.right(O.none);
  }

  return pipe(parseBody("Body", requestBody), RTE.map(O.some));
}

function parseOperationResponses(
  responses?: OpenAPIV3.ResponsesObject
): ParserRTE<OperationResponses> {
  if (responses == null) {
    return RTE.right({
      success: parsedItem({ _tag: "TextResponse" }, "SuccessfulResponse"),
      errors: {},
    });
  }

  const { left: errorResponses, right: successfulResponses } = pipe(
    responses,
    R.partitionWithIndex((code) => +code >= 200 && +code < 300)
  );

  return pipe(
    parseSuccessfulResponses(successfulResponses),
    RTE.bindTo("success"),
    RTE.bind("errors", () => parseErrorResponses(errorResponses)),
    RTE.map(({ success, errors }) => ({
      success,
      errors,
    }))
  );
}

function parseSuccessfulResponses(
  responses: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
  >
): ParserRTE<ResponseItemOrRef> {
  const values = Object.values(responses);

  if (values.length === 0) {
    return RTE.right(
      parsedItem({ _tag: "TextResponse" }, "SuccessfulResponse")
    );
  }

  return parseResponse("SuccessfulResponse", values[0]);
}

function parseErrorResponses(
  responses: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
  >
): ParserRTE<OperationResponses["errors"]> {
  return pipe(
    responses,
    R.traverseWithIndex(RTE.readerTaskEitherSeq)((code, response) =>
      parseResponse(`Response${code}`, response)
    )
  );
}
