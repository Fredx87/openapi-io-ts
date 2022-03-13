import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { parseAllComponents } from "./components";
import { ParserRTE } from "./context";
import { parseAllPaths } from "./operation";
import { getParserOutput, ParserOutput } from "./parserOutput";
import { parseAllServers } from "./server";

export function main(): ParserRTE<ParserOutput> {
  return pipe(
    parseAllComponents(),
    RTE.chain(() => parseAllPaths()),
    RTE.chain(() => parseAllServers()),
    RTE.chain(() => getParserOutput())
  );
}
