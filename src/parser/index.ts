import { pipe } from "fp-ts/lib/pipeable";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { GenRTE } from "../environment";
import { parseAllApis } from "./apis";
import { openApiParser } from "./openapi";
import { parseAllSchemas } from "./schemas";

export function parse(): GenRTE<unknown> {
  return pipe(
    openApiParser(),
    RTE.chain(() => parseAllSchemas()),
    RTE.chain(() => parseAllApis())
  );
}
