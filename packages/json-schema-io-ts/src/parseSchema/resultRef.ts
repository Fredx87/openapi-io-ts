import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ParseSchemaContext } from "../ParseSchemaContext";
import { ParseSchemaResult } from "../ParseSchemaResult";
import { ParseSchemaRTE } from "./ParseSchemaRTE";

export function readResultRef(): ParseSchemaRTE<ParseSchemaResult, never> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.resultRef),
    RTE.chainW((resultRef) => pipe(resultRef.read, RTE.rightIO))
  );
}

export function modifyResultRef(
  fn: (currentRes: ParseSchemaResult) => ParseSchemaResult
): ParseSchemaRTE<void, never> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.resultRef),
    RTE.chainW((resultRef) => pipe(resultRef.modify(fn), RTE.rightIO))
  );
}
