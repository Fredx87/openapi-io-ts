import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as gen from "io-ts-codegen";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import { basename, extname } from "path";
import { ParseSchemaContext } from ".";
import { JsonReference } from "../jsonReference";

export type GeneratedModels = Record<
  string,
  gen.TypeDeclaration | gen.TypeReference
>;

export interface ModelGenerationInfo {
  name: string;
  filePath?: string;
}

export type ModelGenerationInfoFn = (
  reference: JsonReference,
  context: ParseSchemaContext
) => ModelGenerationInfo;

export const defaultModelGenerationInfo: ModelGenerationInfoFn = ({
  uri,
  jsonPointer,
}) =>
  pipe(
    jsonPointer,
    RA.last,
    O.fold(
      (): ModelGenerationInfo => {
        const ext = extname(uri);
        const fileName = basename(uri, ext);
        return { name: pascalCase(fileName) };
      },
      (token): ModelGenerationInfo => ({ name: pascalCase(token) })
    )
  );

export function pascalCase(input: string): string {
  return upperFirst(camelCase(input));
}

export { camelCase };
