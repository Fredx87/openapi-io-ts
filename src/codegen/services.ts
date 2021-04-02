import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as R from "fp-ts/Record";
import { CodegenContext, CodegenRTE } from "./context";
import {
  OPERATIONS_PATH,
  RUNTIME_PACKAGE,
  SERVICES_PATH,
  writeGeneratedFile,
} from "./common";

export function generateServices(): CodegenRTE<void> {
  return pipe(
    RTE.asks((context: CodegenContext) => context.parserOutput.tags),
    RTE.chain((tags) =>
      pipe(
        tags,
        R.traverseWithIndex(RTE.readerTaskEitherSeq)((tag, operationsIds) =>
          generateServiceFile(tag, operationsIds)
        )
      )
    ),
    RTE.map(() => void 0)
  );
}

function generateServiceFile(
  tag: string,
  operationsIds: string[]
): CodegenRTE<void> {
  const content = `import { HttpRequestAdapter } from "${RUNTIME_PACKAGE}";
  ${operationsIds
    .map((o) => `import { ${o} } from '../${OPERATIONS_PATH}/${o}'`)
    .join("\n")}
    
    export const ${tag}ServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
        ${operationsIds.map((o) => `${o}: ${o}(requestAdapter)`).join(",\n")}
    })
    `;

  return writeGeneratedFile(SERVICES_PATH, `${tag}Service.ts`, content);
}
