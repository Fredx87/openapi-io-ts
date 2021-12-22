import { HttpRequestAdapter, Operation, request } from "@openapi-io-ts/runtime";
import { deletePetOperation, DeletePetOperationArgs } from "./deletePet";
import { UpdateUserOperationArgs, updateUserOperation } from "./updateUser";
import * as R from "fp-ts/Record";
import { pipe } from "fp-ts/function";
export const operations = {
  deletePet: deletePetOperation,
  updateUser: updateUserOperation,
} as const;

export interface OperationArgs {
  deletePet: DeletePetOperationArgs;
  updateUser: UpdateUserOperationArgs;
}

export function requestsBuilder(requestAdapter: HttpRequestAdapter) {
  return pipe(operations, R.map(requestBuilder(requestAdapter)));
}

function requestBuilder(requestAdapter: HttpRequestAdapter) {
  return <Name extends keyof typeof operations>(operation: Operation) => (
    args: OperationArgs[Name]
  ) => request({ requestAdapter, operation, ...args });
}
