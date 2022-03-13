import { OperationMethod } from "@openapi-io-ts/core";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as R from "fp-ts/Record";
import {
  concatJsonReference,
  JsonReference,
  JsonSchemaRef,
} from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { parseBodyFromReference, ParsedBody } from "../body";
import { modifyParserState, ParserRTE } from "../context";
import { ParsedParameter, parseParameterFromReference } from "../parameter";
import {
  createParsedItem,
  getOrCreateParsedItemFromRef,
  ParsedItem,
} from "../parsedItem";
import { resolveObjectFromJsonReference } from "../references";
import { ParsedResponse, parseResponseFromReference } from "../response";
import { ParsedOperation } from "./ParsedOperation";

export function parseOperationFromReference(
  operationPath: string,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedOperation>> {
  return pipe(
    resolveObjectFromJsonReference<
      OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.OperationObject
    >(jsonReference),
    RTE.chain((operation) =>
      parseOperation(operationPath, operation, jsonReference)
    )
  );
}

function parseOperation(
  operationPath: string,
  operation: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.OperationObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedOperation>> {
  if (JsonSchemaRef.is(operation)) {
    return getOrCreateParsedItemFromRef<ParsedOperation>(
      operation.$ref,
      (newRef) => parseOperationFromReference(operationPath, newRef)
    );
  }

  return parseOperationObject(operationPath, operation, jsonReference);
}

function parseOperationObject(
  operationPath: string,
  operation: OpenAPIV3_1.OperationObject,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedOperation>> {
  const method = jsonReference.jsonPointer[
    jsonReference.jsonPointer.length - 1
  ] as OperationMethod;
  const { parameters, requestBody, responses, tags } = operation;

  return pipe(
    RTE.Do,
    RTE.bind("parameters", () =>
      parseOperationParameters(
        parameters,
        concatJsonReference(jsonReference, ["parameters"])
      )
    ),
    RTE.bind("body", () =>
      parseOperationBody(
        requestBody,
        concatJsonReference(jsonReference, ["requestBody"])
      )
    ),
    RTE.bind("responses", () =>
      parseOperationResponses(
        responses,
        concatJsonReference(jsonReference, ["responses"])
      )
    ),
    RTE.chain(({ parameters, body, responses }) => {
      const parsedOperation: ParsedOperation = {
        path: operationPath,
        method,
        parameters,
        body,
        responses,
      };
      return createParsedItem(jsonReference, parsedOperation);
    }),
    RTE.chainFirst((parsedOperation) =>
      parseOperationTags(parsedOperation, tags)
    )
  );
}

function parseOperationParameters(
  parameters:
    | (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[]
    | undefined,
  jsonReference: JsonReference
): ParserRTE<ParsedItem<ParsedParameter>[]> {
  if (parameters == null) {
    return RTE.right([]);
  }

  return pipe(
    parameters,
    RTE.traverseSeqArrayWithIndex((i) =>
      parseParameterFromReference(
        concatJsonReference(jsonReference, [String(i)])
      )
    ),
    RTE.map(RA.toArray)
  );
}

function parseOperationBody(
  requestBody:
    | OpenAPIV3_1.ReferenceObject
    | OpenAPIV3_1.RequestBodyObject
    | undefined,
  jsonReference: JsonReference
): ParserRTE<O.Option<ParsedItem<ParsedBody>>> {
  if (requestBody == null) {
    return RTE.right(O.none);
  }

  return pipe(parseBodyFromReference(jsonReference), RTE.map(O.some));
}

function parseOperationResponses(
  responses: OpenAPIV3_1.ResponsesObject | undefined,
  jsonReference: JsonReference
): ParserRTE<Record<string, ParsedItem<ParsedResponse>>> {
  if (responses == null) {
    return RTE.right({});
  }

  return pipe(
    responses,
    R.traverseWithIndex(RTE.ApplicativeSeq)((code) =>
      parseResponseFromReference(concatJsonReference(jsonReference, [code]))
    )
  );
}

function parseOperationTags(
  parsedOperation: ParsedItem<ParsedOperation>,
  tags: string[] | undefined
): ParserRTE<void> {
  if (tags == null) {
    return RTE.right(void 0);
  }

  return pipe(
    tags,
    RTE.traverseSeqArray((tag) =>
      modifyParserState((draft) => {
        const currentOperations = draft.tags[tag];
        draft.tags[tag] = currentOperations
          ? currentOperations.concat(parsedOperation)
          : [parsedOperation];
      })
    ),
    RTE.map(() => void 0)
  );
}
