import { OperationParameterIn } from "@openapi-io-ts/core";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Record";
import * as t from "io-ts";
import { Endpoint, Operation, OperationParameter } from "../model";

interface ValidateRequestArgs {
  operation: Operation;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
}

export type ValidateRequestResult<T extends Endpoint> = Pick<
  T,
  "parameters" | "body"
>;

export function validateRequest<T extends Endpoint>({
  operation,
  pathParams,
  queryParams,
  body,
}: ValidateRequestArgs): E.Either<t.Errors, ValidateRequestResult<T>> {
  return pipe(
    E.Do,
    E.bind("validatedPathParams", () =>
      validateParameters("path", operation, pathParams)
    ),
    E.bind("validatedQueryParams", () =>
      validateParameters("query", operation, queryParams)
    ),
    E.bind("validatedBody", () => validateBody(operation, body)),
    E.map(({ validatedPathParams, validatedQueryParams, validatedBody }) => {
      return {
        parameters: { ...validatedQueryParams, ...validatedPathParams },
        body: validatedBody,
      };
    })
  );
}

function validateParameters<T extends Endpoint>(
  parameterIn: OperationParameterIn,
  operation: Operation,
  pathParams?: Record<string, string>
): E.Either<t.Errors, ValidateRequestResult<T>["parameters"]> {
  if (pathParams == null) {
    return E.right({});
  }

  return pipe(
    pathParams,
    R.traverseWithIndex(E.Applicative)((name, value) =>
      validateParameter(parameterIn, name, value, operation)
    )
  );
}

function validateBody<T extends Endpoint>(
  operation: Operation,
  body?: unknown
): E.Either<t.Errors, ValidateRequestResult<T>["body"]> {
  if (operation.body == null) {
    return E.right(undefined);
  }

  if (operation.body._tag === "JsonBody") {
    return operation.body.decoder.decode(body);
  }

  return E.right(body);
}

function validateParameter<T extends Endpoint>(
  parameterIn: OperationParameterIn,
  name: string,
  value: string,
  operation: Operation
): E.Either<t.Errors, ValidateRequestResult<T>["parameters"]> {
  return pipe(
    findOperationParameter(parameterIn, name, operation),
    O.fold(
      () => E.right({}),
      (operationParameter) =>
        validateOperationParameter(operationParameter, name, value)
    )
  );
}

function findOperationParameter(
  parameterIn: string,
  name: string,
  operation: Operation
): O.Option<OperationParameter> {
  return O.fromNullable(
    operation.parameters.find((p) => p.in === parameterIn && p.name === name)
  );
}

function validateOperationParameter<T extends Endpoint>(
  operationParameter: OperationParameter,
  name: string,
  value: string
): E.Either<t.Errors, ValidateRequestResult<T>["parameters"]> {
  if (operationParameter._tag === "JsonParameter") {
    return pipe(
      operationParameter.decoder.decode(value),
      E.chain((decoded) => E.right({ [name]: decoded }))
    );
  }

  return E.right({ [name]: value });
}
