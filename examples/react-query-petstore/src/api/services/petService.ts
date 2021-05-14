import { HttpRequestAdapter } from "@openapi-io-ts/runtime";
import { addPetBuilder } from "../operations/addPet";
import { deletePetBuilder } from "../operations/deletePet";
import { findPetsByStatusBuilder } from "../operations/findPetsByStatus";
import { findPetsByTagsBuilder } from "../operations/findPetsByTags";
import { getPetByIdBuilder } from "../operations/getPetById";
import { updatePetBuilder } from "../operations/updatePet";
import { updatePetWithFormBuilder } from "../operations/updatePetWithForm";
import { uploadFileBuilder } from "../operations/uploadFile";

export const petServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  addPet: addPetBuilder(requestAdapter),
  updatePet: updatePetBuilder(requestAdapter),
  findPetsByStatus: findPetsByStatusBuilder(requestAdapter),
  findPetsByTags: findPetsByTagsBuilder(requestAdapter),
  getPetById: getPetByIdBuilder(requestAdapter),
  updatePetWithForm: updatePetWithFormBuilder(requestAdapter),
  deletePet: deletePetBuilder(requestAdapter),
  uploadFile: uploadFileBuilder(requestAdapter),
});
