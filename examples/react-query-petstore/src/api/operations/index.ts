import {
  HttpRequestAdapter,
  MappedOperationRequestFunction,
  request,
} from "@openapi-io-ts/runtime";
import { addPetOperation, AddPetOperationTypes } from "./addPet";
import { createUserOperation, CreateUserOperationTypes } from "./createUser";
import {
  createUsersWithListInputOperation,
  CreateUsersWithListInputOperationTypes,
} from "./createUsersWithListInput";
import { deleteOrderOperation, DeleteOrderOperationTypes } from "./deleteOrder";
import { deletePetOperation, DeletePetOperationTypes } from "./deletePet";
import { deleteUserOperation, DeleteUserOperationTypes } from "./deleteUser";
import {
  findPetsByStatusOperation,
  FindPetsByStatusOperationTypes,
} from "./findPetsByStatus";
import {
  findPetsByTagsOperation,
  FindPetsByTagsOperationTypes,
} from "./findPetsByTags";
import {
  getInventoryOperation,
  GetInventoryOperationTypes,
} from "./getInventory";
import {
  getOrderByIdOperation,
  GetOrderByIdOperationTypes,
} from "./getOrderById";
import { getPetByIdOperation, GetPetByIdOperationTypes } from "./getPetById";
import {
  getUserByNameOperation,
  GetUserByNameOperationTypes,
} from "./getUserByName";
import { loginUserOperation, LoginUserOperationTypes } from "./loginUser";
import { logoutUserOperation, LogoutUserOperationTypes } from "./logoutUser";
import { placeOrderOperation, PlaceOrderOperationTypes } from "./placeOrder";
import { updatePetOperation, UpdatePetOperationTypes } from "./updatePet";
import {
  updatePetWithFormOperation,
  UpdatePetWithFormOperationTypes,
} from "./updatePetWithForm";
import { updateUserOperation, UpdateUserOperationTypes } from "./updateUser";
import { uploadFileOperation, UploadFileOperationTypes } from "./uploadFile";

export const petOperations = {
  addPet: addPetOperation,
  updatePet: updatePetOperation,
  findPetsByStatus: findPetsByStatusOperation,
  findPetsByTags: findPetsByTagsOperation,
  getPetById: getPetByIdOperation,
  updatePetWithForm: updatePetWithFormOperation,
  deletePet: deletePetOperation,
  uploadFile: uploadFileOperation,
} as const;

export interface PetOperationsTypesMap {
  addPet: AddPetOperationTypes;
  updatePet: UpdatePetOperationTypes;
  findPetsByStatus: FindPetsByStatusOperationTypes;
  findPetsByTags: FindPetsByTagsOperationTypes;
  getPetById: GetPetByIdOperationTypes;
  updatePetWithForm: UpdatePetWithFormOperationTypes;
  deletePet: DeletePetOperationTypes;
  uploadFile: UploadFileOperationTypes;
}

export const petServiceBuilder = (
  requestAdapter: HttpRequestAdapter
): MappedOperationRequestFunction<
  typeof petOperations,
  PetOperationsTypesMap
> => ({
  addPet: request(petOperations.addPet, requestAdapter),
  updatePet: request(petOperations.updatePet, requestAdapter),
  findPetsByStatus: request(petOperations.findPetsByStatus, requestAdapter),
  findPetsByTags: request(petOperations.findPetsByTags, requestAdapter),
  getPetById: request(petOperations.getPetById, requestAdapter),
  updatePetWithForm: request(petOperations.updatePetWithForm, requestAdapter),
  deletePet: request(petOperations.deletePet, requestAdapter),
  uploadFile: request(petOperations.uploadFile, requestAdapter),
});

export const storeOperations = {
  getInventory: getInventoryOperation,
  placeOrder: placeOrderOperation,
  getOrderById: getOrderByIdOperation,
  deleteOrder: deleteOrderOperation,
} as const;

export interface StoreOperationsTypesMap {
  getInventory: GetInventoryOperationTypes;
  placeOrder: PlaceOrderOperationTypes;
  getOrderById: GetOrderByIdOperationTypes;
  deleteOrder: DeleteOrderOperationTypes;
}

export const storeServiceBuilder = (
  requestAdapter: HttpRequestAdapter
): MappedOperationRequestFunction<
  typeof storeOperations,
  StoreOperationsTypesMap
> => ({
  getInventory: request(storeOperations.getInventory, requestAdapter),
  placeOrder: request(storeOperations.placeOrder, requestAdapter),
  getOrderById: request(storeOperations.getOrderById, requestAdapter),
  deleteOrder: request(storeOperations.deleteOrder, requestAdapter),
});

export const userOperations = {
  createUser: createUserOperation,
  createUsersWithListInput: createUsersWithListInputOperation,
  loginUser: loginUserOperation,
  logoutUser: logoutUserOperation,
  getUserByName: getUserByNameOperation,
  updateUser: updateUserOperation,
  deleteUser: deleteUserOperation,
} as const;

export interface UserOperationsTypesMap {
  createUser: CreateUserOperationTypes;
  createUsersWithListInput: CreateUsersWithListInputOperationTypes;
  loginUser: LoginUserOperationTypes;
  logoutUser: LogoutUserOperationTypes;
  getUserByName: GetUserByNameOperationTypes;
  updateUser: UpdateUserOperationTypes;
  deleteUser: DeleteUserOperationTypes;
}

export const userServiceBuilder = (
  requestAdapter: HttpRequestAdapter
): MappedOperationRequestFunction<
  typeof userOperations,
  UserOperationsTypesMap
> => ({
  createUser: request(userOperations.createUser, requestAdapter),
  createUsersWithListInput: request(
    userOperations.createUsersWithListInput,
    requestAdapter
  ),
  loginUser: request(userOperations.loginUser, requestAdapter),
  logoutUser: request(userOperations.logoutUser, requestAdapter),
  getUserByName: request(userOperations.getUserByName, requestAdapter),
  updateUser: request(userOperations.updateUser, requestAdapter),
  deleteUser: request(userOperations.deleteUser, requestAdapter),
});

export const requestFunctionsBuilder = (
  requestAdapter: HttpRequestAdapter
) => ({
  ...petServiceBuilder(requestAdapter),
  ...storeServiceBuilder(requestAdapter),
  ...userServiceBuilder(requestAdapter),
});
