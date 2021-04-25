import { TaskEither } from "fp-ts/TaskEither";
import { fold } from "fp-ts/Either";
import { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
} from "react-query";
import { failure } from "io-ts/PathReporter";

export function useOpenApiQuery<TQueryKey extends QueryKey, TReturnType>(
  queryKey: TQueryKey,
  request: TaskEither<ApiError, ApiResponse<TReturnType>>
) {
  return useQuery<ApiResponse<TReturnType>, ApiError>(queryKey, () =>
    toPromise(request)
  );
}

export function useOpenApiMutation<
  TData,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (
    variables: TVariables
  ) => TaskEither<ApiError, ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables, TContext>
) {
  return useMutation(
    (variables: TVariables) => toPromise(mutationFn(variables)),
    options
  );
}

function toPromise<T>(
  te: TaskEither<ApiError, ApiResponse<T>>
): Promise<ApiResponse<T>> {
  return te().then(
    fold(
      (error) => {
        if (error._tag === "DecodeError") {
          console.error("Decode error", failure(error.errors));
        }
        return Promise.reject(error);
      },
      (resp) => Promise.resolve(resp)
    )
  );
}
