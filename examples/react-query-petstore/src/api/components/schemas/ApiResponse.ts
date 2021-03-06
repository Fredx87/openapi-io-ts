import * as t from "io-ts";

export const ApiResponse = t.partial({
  code: t.number,
  type: t.string,
  message: t.string,
});

export interface ApiResponse {
  code?: number;
  type?: string;
  message?: string;
}
