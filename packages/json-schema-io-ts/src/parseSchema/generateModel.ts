import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import produce from "immer";
import * as gen from "io-ts-codegen";
import { JsonReference, jsonReferenceToString } from "../jsonReference";
import { modifyGeneratedModelsRef } from "./ioRefs";
import { ModelGenerationInfo } from "./modelGeneration";
import { ParseSchemaContext } from "./ParseSchemaContext";
import { ParseSchemaRTE } from "./types";

export function generateModel(
  reference: JsonReference,
  type: gen.TypeReference
): ParseSchemaRTE<gen.TypeReference> {
  return pipe(
    RTE.Do,
    RTE.bind("generationInfo", () => getModelGenerationInfo(reference)),
    RTE.bind("model", ({ generationInfo }) =>
      RTE.right(
        generateModelFromTypeReferenceAndGenerationInfo(type, generationInfo)
      )
    ),
    RTE.chainFirst(({ model }) => addModelToContext(reference, model)),
    RTE.map(({ model }) => getReferenceFromGeneratedModel(model))
  );
}

export function getReferenceFromGeneratedModel(
  generatedModel: gen.TypeDeclaration | gen.TypeReference
): gen.TypeReference {
  if (generatedModel.kind === "TypeDeclaration") {
    if (generatedModel.filePath != null) {
      return gen.importedIdentifier(
        generatedModel.name,
        generatedModel.filePath
      );
    } else {
      return gen.identifier(generatedModel.name);
    }
  }

  return generatedModel;
}

function getModelGenerationInfo(
  reference: JsonReference
): ParseSchemaRTE<ModelGenerationInfo> {
  return pipe(
    RTE.asks((context: ParseSchemaContext) => context.modelGenerationInfoFn),
    RTE.map((getModelGenerationInfo) => getModelGenerationInfo(reference))
  );
}

function generateModelFromTypeReferenceAndGenerationInfo(
  typeReference: gen.TypeReference,
  { name, filePath }: ModelGenerationInfo
): gen.TypeReference | gen.TypeDeclaration {
  if (shouldGenerateDeclaration(typeReference)) {
    return gen.typeDeclaration(
      name,
      typeReference,
      true,
      undefined,
      undefined,
      filePath
    );
  }

  return typeReference;
}

function addModelToContext(
  reference: JsonReference,
  type: gen.TypeReference | gen.TypeDeclaration
): ParseSchemaRTE<void> {
  return pipe(
    modifyGeneratedModelsRef(
      produce((draft) => {
        draft[jsonReferenceToString(reference)] = type;
      })
    )
  );
}

function shouldGenerateDeclaration(type: gen.TypeReference): boolean {
  switch (type.kind) {
    case "ArrayCombinator":
      return shouldGenerateDeclaration(type.type);
    case "IntersectionCombinator":
    case "UnionCombinator":
    case "TupleCombinator":
      return type.types.some(shouldGenerateDeclaration);
    case "InterfaceCombinator":
    case "TaggedUnionCombinator":
      return true;
    default:
      return false;
  }
}
