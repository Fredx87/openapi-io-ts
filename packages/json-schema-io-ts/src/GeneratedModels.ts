import * as gen from "io-ts-codegen";

export interface GeneratedModels {
  modelNameTypeMap: Record<string, gen.TypeReference>;
  referenceModelNameMap: Record<string, string>;
  prefixImportPathMap: Record<string, string>;
}
