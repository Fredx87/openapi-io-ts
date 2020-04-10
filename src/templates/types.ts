export type ResponseError =
  | {
      kind: "Parser error";
    }
  | {
      kind: "Http error";
      statusCode: number;
      message: string;
    };
