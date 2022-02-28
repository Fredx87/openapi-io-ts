import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { JsonReference } from "json-schema-io-ts";
import { OpenAPIV3_1 } from "openapi-types";
import { ParserContext, ParserRTE } from "../context";
import { parseOperationFromReference } from "./parseOperation";

export function parseAllPaths(): ParserRTE<void> {
  return pipe(
    RTE.ask<ParserContext>(),
    RTE.chain((context) => {
      const { paths } = context.document;
      const { rootDocumentUri } = context.parseSchemaContext;

      if (paths == null) {
        return RTE.right(void 0);
      }

      const tasks = Object.entries(paths).map(([path, pathObject]) =>
        pathObject
          ? parsePath(rootDocumentUri, path, pathObject)
          : RTE.right(void 0)
      );
      return RTE.sequenceSeqArray(tasks);
    }),
    RTE.map(() => void 0)
  );
}

function parsePath(
  rootDocumentUri: string,
  path: string,
  pathObject: OpenAPIV3_1.PathItemObject
): ParserRTE<void> {
  const operations = {
    get: pathObject?.get,
    post: pathObject?.post,
    put: pathObject?.put,
    delete: pathObject?.delete,
  };

  return pipe(
    Object.entries(operations),
    RTE.traverseSeqArray(([method, operation]) => {
      if (operation == null) {
        return RTE.right(void 0);
      }

      const jsonReference: JsonReference = {
        uri: rootDocumentUri,
        jsonPointer: ["paths", path, method],
      };

      return parseOperationFromReference(path, jsonReference);
    }),
    RTE.map(() => void 0)
  );
}
