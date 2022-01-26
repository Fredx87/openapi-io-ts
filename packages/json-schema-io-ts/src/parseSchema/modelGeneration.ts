import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as gen from "io-ts-codegen";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import { basename, extname } from "path";
import { JsonReference } from "../jsonReference";

export interface GeneratedModels {
  modelNameTypeMap: Record<string, gen.TypeReference>;
  referenceModelNameMap: Record<string, string>;
  prefixImportPathMap: Record<string, string>;
}

export const initialGeneratedModels: GeneratedModels = {
  modelNameTypeMap: {},
  referenceModelNameMap: {},
  prefixImportPathMap: {
    tTypes: "io-ts-types",
  },
};

export interface ModelGenerationInfo {
  name: string;
  importData?: {
    prefix: string;
    path: string;
  };
}

export type ModelGenerationInfoFn = (
  reference: JsonReference
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
        return { name: upperFirst(camelCase(fileName)) };
      },
      (token): ModelGenerationInfo => ({ name: upperFirst(camelCase(token)) })
    )
  );
