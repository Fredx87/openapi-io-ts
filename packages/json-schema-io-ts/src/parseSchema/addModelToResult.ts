import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { JsonReference } from "../jsonReference";
import { ModelGenerationInfo, ParseSchemaContext } from "../ParseSchemaContext";
import { ParseSchemaRTE } from "./ParseSchemaRTE";
import { modifyGeneratedModelsRef } from "./generatedModels";
import { jsonReferenceToString } from "..";

export function addModelToResultIfNeeded(
  reference: JsonReference,
  type: gen.TypeReference
): ParseSchemaRTE<O.Option<string>> {
  if (!shouldGenerateModel(type)) {
    return RTE.right(O.none);
  }

  return pipe(
    RTE.Do,
    RTE.bind("generationInfo", () => getModelGenerationInfo(reference)),
    RTE.chainFirst(({ generationInfo }) =>
      addModelToContext(reference, generationInfo, type)
    ),
    RTE.map(({ generationInfo }) => O.some(generationInfo.name))
  );
}

function getModelGenerationInfo(
  reference: JsonReference
): ParseSchemaRTE<ModelGenerationInfo> {
  return pipe(
    RTE.asks((context: ParseSchemaContext) => context.modelGenerationInfoFn),
    RTE.map((getModelGenerationInfo) => getModelGenerationInfo(reference))
  );
}

function addModelToContext(
  reference: JsonReference,
  generationInfo: ModelGenerationInfo,
  type: gen.TypeReference
): ParseSchemaRTE<void> {
  return modifyGeneratedModelsRef(
    produce((draft) => {
      const generatedName = getModelNameFromGenerationInfo(generationInfo);

      draft.modelNameTypeMap[generatedName] = type;

      draft.referenceModelNameMap[jsonReferenceToString(reference)] =
        generatedName;

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
