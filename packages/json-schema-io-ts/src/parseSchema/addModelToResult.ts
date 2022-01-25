import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { createJsonPointer, JsonPointer } from "../JsonReference";
import { ModelGenerationInfo, ParseSchemaContext } from "../ParseSchemaContext";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { modifyResultRef } from "./resultRef";

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
      addPointerAndModelNameToContext(jsonPointer, generationInfo)
    ),
    RTE.map(() => undefined)
  );
}

function getModelGenerationInfo(
  pointer: JsonPointer
): ParseSchemaRTE<ModelGenerationInfo> {
  return pipe(
    RTE.asks((context: ParseSchemaContext) => context.getModelGenerationInfo),
    RTE.map((getModelGenerationInfo) => getModelGenerationInfo(pointer))
  );
}

function addPointerAndModelNameToContext(
  pointer: JsonPointer,
  generationInfo: ModelGenerationInfo
): ParseSchemaRTE<void> {
  return modifyResultRef(
    produce((draft) => {
      draft.pointerModelNameMap[pointer.toString()] =
        getModelNameFromGenerationInfo(generationInfo);

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
