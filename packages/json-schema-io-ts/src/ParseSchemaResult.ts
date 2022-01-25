import * as gen from "io-ts-codegen";

export interface ParseSchemaResult {
  modelNameTypeMap: Record<string, gen.TypeReference>;
  pointerModelNameMap: Record<string, string>;
  prefixImportPathMap: Record<string, string>;
}
