import { OpenAPIV3 } from "openapi-types";
import { modifyParserOutput, ParserContext, ParserRTE } from "./context";
import * as RTE from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

export interface ParsedServer {
  url: string;
}

export function parseAllServers(): ParserRTE<void> {
  return pipe(
    RTE.asks((context: ParserContext) => context.document.servers ?? []),
    RTE.map((servers) => servers.map(parseServer)),
    RTE.chain((parsedServers) =>
      modifyParserOutput((draft) => {
        draft.servers = parsedServers;
      })
    )
  );
}

function parseServer(server: OpenAPIV3.ServerObject): ParsedServer {
  return { url: server.url };
}
