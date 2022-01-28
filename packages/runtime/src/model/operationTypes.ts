export type ParametersRecord = Record<string, unknown> | undefined;

type OperationArgsParams<RequestParameters extends ParametersRecord> =
  RequestParameters extends undefined
    ? { params?: undefined }
    : { params: RequestParameters };

type OperationArgsBody<RequestBody> = RequestBody extends undefined
  ? { body?: undefined }
  : { body: RequestBody };

export type OperationArgs<
  RequestParameters extends ParametersRecord,
  RequestBody
> = OperationArgsParams<RequestParameters> & OperationArgsBody<RequestBody>;

export type OperationTypes<
  RequestParameters extends ParametersRecord,
  RequestBody,
  ReturnType
> = {
  args: OperationArgs<RequestParameters, RequestBody>;
  returnType: ReturnType;
};
