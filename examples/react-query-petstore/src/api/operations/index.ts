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

export const operations = {
  addPet: addPetOperation,
  updatePet: updatePetOperation,
  findPetsByStatus: findPetsByStatusOperation,
  findPetsByTags: findPetsByTagsOperation,
  getPetById: getPetByIdOperation,
  updatePetWithForm: updatePetWithFormOperation,
  deletePet: deletePetOperation,
  uploadFile: uploadFileOperation,
  getInventory: getInventoryOperation,
  placeOrder: placeOrderOperation,
  getOrderById: getOrderByIdOperation,
  deleteOrder: deleteOrderOperation,
  createUser: createUserOperation,
  createUsersWithListInput: createUsersWithListInputOperation,
  loginUser: loginUserOperation,
  logoutUser: logoutUserOperation,
  getUserByName: getUserByNameOperation,
  updateUser: updateUserOperation,
  deleteUser: deleteUserOperation,
} as const;

export interface OperationsTypesMap {
  addPet: AddPetOperationTypes;
  updatePet: UpdatePetOperationTypes;
  findPetsByStatus: FindPetsByStatusOperationTypes;
  findPetsByTags: FindPetsByTagsOperationTypes;
  getPetById: GetPetByIdOperationTypes;
  updatePetWithForm: UpdatePetWithFormOperationTypes;
  deletePet: DeletePetOperationTypes;
  uploadFile: UploadFileOperationTypes;
  getInventory: GetInventoryOperationTypes;
  placeOrder: PlaceOrderOperationTypes;
  getOrderById: GetOrderByIdOperationTypes;
  deleteOrder: DeleteOrderOperationTypes;
  createUser: CreateUserOperationTypes;
  createUsersWithListInput: CreateUsersWithListInputOperationTypes;
  loginUser: LoginUserOperationTypes;
  logoutUser: LogoutUserOperationTypes;
  getUserByName: GetUserByNameOperationTypes;
  updateUser: UpdateUserOperationTypes;
  deleteUser: DeleteUserOperationTypes;
}

export const requestFunctionsBuilder = (
  requestAdapter: HttpRequestAdapter
): MappedOperationRequestFunction<typeof operations, OperationsTypesMap> => ({
  addPet: request(operations.addPet, requestAdapter),
  updatePet: request(operations.updatePet, requestAdapter),
  findPetsByStatus: request(operations.findPetsByStatus, requestAdapter),
  findPetsByTags: request(operations.findPetsByTags, requestAdapter),
  getPetById: request(operations.getPetById, requestAdapter),
  updatePetWithForm: request(operations.updatePetWithForm, requestAdapter),
  deletePet: request(operations.deletePet, requestAdapter),
  uploadFile: request(operations.uploadFile, requestAdapter),
  getInventory: request(operations.getInventory, requestAdapter),
  placeOrder: request(operations.placeOrder, requestAdapter),
  getOrderById: request(operations.getOrderById, requestAdapter),
  deleteOrder: request(operations.deleteOrder, requestAdapter),
  createUser: request(operations.createUser, requestAdapter),
  createUsersWithListInput: request(
    operations.createUsersWithListInput,
    requestAdapter
  ),
  loginUser: request(operations.loginUser, requestAdapter),
  logoutUser: request(operations.logoutUser, requestAdapter),
  getUserByName: request(operations.getUserByName, requestAdapter),
  updateUser: request(operations.updateUser, requestAdapter),
  deleteUser: request(operations.deleteUser, requestAdapter),
});

export const petServiceBuilder = (
  requestFunctions: MappedOperationRequestFunction<
    typeof operations,
    OperationsTypesMap
  >
) => ({
  addPet: requestFunctions.addPet,
  updatePet: requestFunctions.updatePet,
  findPetsByStatus: requestFunctions.findPetsByStatus,
  findPetsByTags: requestFunctions.findPetsByTags,
  getPetById: requestFunctions.getPetById,
  updatePetWithForm: requestFunctions.updatePetWithForm,
  deletePet: requestFunctions.deletePet,
  uploadFile: requestFunctions.uploadFile,
});

export const storeServiceBuilder = (
  requestFunctions: MappedOperationRequestFunction<
    typeof operations,
    OperationsTypesMap
  >
) => ({
  getInventory: requestFunctions.getInventory,
  placeOrder: requestFunctions.placeOrder,
  getOrderById: requestFunctions.getOrderById,
  deleteOrder: requestFunctions.deleteOrder,
});

export const userServiceBuilder = (
  requestFunctions: MappedOperationRequestFunction<
    typeof operations,
    OperationsTypesMap
  >
) => ({
  createUser: requestFunctions.createUser,
  createUsersWithListInput: requestFunctions.createUsersWithListInput,
  loginUser: requestFunctions.loginUser,
  logoutUser: requestFunctions.logoutUser,
  getUserByName: requestFunctions.getUserByName,
  updateUser: requestFunctions.updateUser,
  deleteUser: requestFunctions.deleteUser,
});
