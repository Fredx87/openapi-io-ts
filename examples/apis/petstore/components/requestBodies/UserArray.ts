import { OperationBody } from "openapi-io-ts/dist/runtime";
import * as schemas from "../schemas";
export type UserArraySchema = Array<schemas.User>;

export const UserArray: OperationBody = {
  _tag: "JsonBody",
};
