export interface BinaryBody {
  _tag: "BinaryBody";
  mediaType: string;
}

export interface FormBody {
  _tag: "FormBody";
}

export interface MultipartBody {
  _tag: "MultipartBody";
}

export interface JsonBody {
  _tag: "JsonBody";
}

export interface TextBody {
  _tag: "TextBody";
}

export type OperationBody =
  | BinaryBody
  | FormBody
  | MultipartBody
  | JsonBody
  | TextBody;
