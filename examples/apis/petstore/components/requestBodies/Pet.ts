import { OperationBody } from "openapi-io-ts/dist/runtime";
import * as schemas from "../schemas";
export type PetSchema = schemas.Pet;

export const Pet: OperationBody = {
  _tag: "JsonBody",
};
