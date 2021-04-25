import { HttpRequestAdapter } from "@openapi-io-ts/runtime";
import { addPet } from "../operations/addPet";
import { deletePet } from "../operations/deletePet";
import { findPetsByStatus } from "../operations/findPetsByStatus";
import { findPetsByTags } from "../operations/findPetsByTags";
import { getPetById } from "../operations/getPetById";
import { updatePet } from "../operations/updatePet";
import { updatePetWithForm } from "../operations/updatePetWithForm";
import { uploadFile } from "../operations/uploadFile";

export const petServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  addPet: addPet(requestAdapter),
  updatePet: updatePet(requestAdapter),
  findPetsByStatus: findPetsByStatus(requestAdapter),
  findPetsByTags: findPetsByTags(requestAdapter),
  getPetById: getPetById(requestAdapter),
  updatePetWithForm: updatePetWithForm(requestAdapter),
  deletePet: deletePet(requestAdapter),
  uploadFile: uploadFile(requestAdapter),
});
