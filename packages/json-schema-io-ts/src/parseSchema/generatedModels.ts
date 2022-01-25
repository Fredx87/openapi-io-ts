import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { ParseSchemaContext } from "../ParseSchemaContext";
import { GeneratedModels } from "../GeneratedModels";
import { ParseSchemaRTE } from "./ParseSchemaRTE";

export function readGeneratedModelsRef(): ParseSchemaRTE<
  GeneratedModels,
  never
> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.generatedModelsRef),
    RTE.chainW((resultRef) => pipe(resultRef.read, RTE.rightIO))
  );
}

export function modifyGeneratedModelsRef(
  fn: (currentRes: GeneratedModels) => GeneratedModels
): ParseSchemaRTE<void, never> {
  return pipe(
    RTE.asks((r: ParseSchemaContext) => r.generatedModelsRef),
    RTE.chainW((resultRef) => pipe(resultRef.modify(fn), RTE.rightIO))
  );
}
