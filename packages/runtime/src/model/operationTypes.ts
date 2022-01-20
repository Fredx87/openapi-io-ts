type OperationArgsParams<
  RequestParameters
> = RequestParameters extends undefined
  ? { params?: undefined }
  : { params: RequestParameters };

type OperationArgsBody<
  RequestBody
  // eslint-disable-next-line @typescript-eslint/ban-types
> = RequestBody extends undefined
  ? { body?: undefined }
  : { body: RequestBody };

export type OperationArgs<
  RequestParameters,
  RequestBody
> = OperationArgsParams<RequestParameters> & OperationArgsBody<RequestBody>;

export type OperationTypes<RequestParameters, RequestBody, ReturnType> = {
  args: OperationArgs<RequestParameters, RequestBody>;
  returnType: ReturnType;
};
