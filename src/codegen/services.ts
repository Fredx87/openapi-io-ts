import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { CodegenRTE } from "./context";
import { OPERATIONS_PATH, SERVICES_PATH, writeGeneratedFile } from "./common";

export function generateServices(
  tags: Record<string, string[]>
): CodegenRTE<void> {
  return pipe(
    Object.entries(tags),
    RTE.traverseSeqArray(([tag, operationsIds]) =>
      generateServiceFile(tag, operationsIds)
    ),
    RTE.map(() => void 0)
  );
}

function generateServiceFile(
  tag: string,
  operationsIds: string[]
): CodegenRTE<void> {
  const content = `import { HttpRequestAdapter } from "../openapi-client/httpRequestAdapter";

  ${operationsIds
    .map((o) => `import { ${o} } from '../${OPERATIONS_PATH}/${o}'`)
    .join("\n")}
    
    export const ${tag}ServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
        ${operationsIds.map((o) => `${o}: ${o}(requestAdapter)`).join(",\n")}
    })
    `;

  return writeGeneratedFile(SERVICES_PATH, `${tag}Service.ts`, content);
}
