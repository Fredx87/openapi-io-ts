import * as RTE from "fp-ts/ReaderTaskEither";
import * as gen from "io-ts-codegen";
import { ParseSchemaContext } from "../ParseSchemaContext";

export type ParseSchemaRTE<
  A = gen.TypeReference,
  E = Error
> = RTE.ReaderTaskEither<ParseSchemaContext, E, A>;
