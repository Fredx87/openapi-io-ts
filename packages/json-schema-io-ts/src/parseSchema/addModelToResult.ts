import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { createJsonPointer, JsonPointer } from "../JsonReference";
import { ModelGenerationInfo, ParseSchemaContext } from "../ParseSchemaContext";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { modifyGeneratedModelsRef } from "./generatedModels";

export function addModelToResultIfNeeded(
  pointer: string,
  type: gen.TypeReference
): ParseSchemaRTE<void> {
  if (!shouldGenerateModel(type)) {
    return RTE.right(undefined);
  }

  return pipe(
    RTE.Do,
    RTE.bind("jsonPointer", () =>
      pipe(createJsonPointer(pointer), RTE.fromEither)
    ),
    RTE.bind("generationInfo", ({ jsonPointer }) =>
      getModelGenerationInfo(jsonPointer)
    ),
    RTE.chainFirst(({ jsonPointer, generationInfo }) =>
      addModelToContext(jsonPointer, generationInfo, type)
    ),
    RTE.map(() => undefined)
  );
}

function getModelGenerationInfo(
  pointer: JsonPointer
): ParseSchemaRTE<ModelGenerationInfo> {
  return pipe(
    RTE.asks((context: ParseSchemaContext) => context.modelGenerationInfoFn),
    RTE.map((getModelGenerationInfo) => getModelGenerationInfo(pointer))
  );
}

function addModelToContext(
  pointer: JsonPointer,
  generationInfo: ModelGenerationInfo,
  type: gen.TypeReference
): ParseSchemaRTE<void> {
  return modifyGeneratedModelsRef(
    produce((draft) => {
      const generatedName = getModelNameFromGenerationInfo(generationInfo);

      draft.modelNameTypeMap[generatedName] = type;

      draft.pointerModelNameMap[pointer.toString()] = generatedName;

      if (generationInfo.importData != null) {
        const { path, prefix } = generationInfo.importData;
        draft.prefixImportPathMap[prefix] = path;
      }
    })
  );
}

function getModelNameFromGenerationInfo({
  name,
  importData,
}: ModelGenerationInfo): string {
  return importData != null ? `${importData.prefix}.${name}` : name;
}

function shouldGenerateModel(type: gen.TypeReference): boolean {
  switch (type.kind) {
    case "ArrayCombinator":
      return shouldGenerateModel(type.type);
    case "IntersectionCombinator":
    case "UnionCombinator":
    case "TupleCombinator":
      return type.types.some(shouldGenerateModel);
    case "InterfaceCombinator":
    case "TaggedUnionCombinator":
      return true;
    default:
      return false;
  }
}
