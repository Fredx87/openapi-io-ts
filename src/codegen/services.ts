import { pipe } from "fp-ts/function";
import { GenRTE } from "../environment";
import * as RTE from "fp-ts/ReaderTaskEither";
import { writeFormatted } from "./common";

export function generateServices(tags: Record<string, string[]>): GenRTE<void> {
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
): GenRTE<void> {
  const content = `import { HttpRequestAdapter } from "../openapi-client/httpRequestAdapter";

  ${operationsIds
    .map((o) => `import { ${o} } from '../operations/${o}'`)
    .join("\n")}
    
    export const ${tag}ServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
        ${operationsIds.map((o) => `${o}: ${o}(requestAdapter)`).join(",\n")}
    })
    `;

  return writeFormatted(`services/${tag}Service.ts`, content);
}
