import {
  HttpRequestAdapter,
  requestFunctionBuilder,
} from "@openapi-io-ts/runtime";
import { addPetOperation, AddPetOperationRequestFunction } from "./addPet";
import {
  createUserOperation,
  CreateUserOperationRequestFunction,
} from "./createUser";
import {
  createUsersWithListInputOperation,
  CreateUsersWithListInputOperationRequestFunction,
} from "./createUsersWithListInput";
import {
  deleteOrderOperation,
  DeleteOrderOperationRequestFunction,
} from "./deleteOrder";
import {
  deletePetOperation,
  DeletePetOperationRequestFunction,
} from "./deletePet";
import {
  deleteUserOperation,
  DeleteUserOperationRequestFunction,
} from "./deleteUser";
import {
  findPetsByStatusOperation,
  FindPetsByStatusOperationRequestFunction,
} from "./findPetsByStatus";
import {
  findPetsByTagsOperation,
  FindPetsByTagsOperationRequestFunction,
} from "./findPetsByTags";
import {
  getInventoryOperation,
  GetInventoryOperationRequestFunction,
} from "./getInventory";
import {
  getOrderByIdOperation,
  GetOrderByIdOperationRequestFunction,
} from "./getOrderById";
import {
  getPetByIdOperation,
  GetPetByIdOperationRequestFunction,
} from "./getPetById";
import {
  getUserByNameOperation,
  GetUserByNameOperationRequestFunction,
} from "./getUserByName";
import {
  loginUserOperation,
  LoginUserOperationRequestFunction,
} from "./loginUser";
import {
  logoutUserOperation,
  LogoutUserOperationRequestFunction,
} from "./logoutUser";
import {
  placeOrderOperation,
  PlaceOrderOperationRequestFunction,
} from "./placeOrder";
import {
  updatePetOperation,
  UpdatePetOperationRequestFunction,
} from "./updatePet";
import {
  updatePetWithFormOperation,
  UpdatePetWithFormOperationRequestFunction,
} from "./updatePetWithForm";
import {
  updateUserOperation,
  UpdateUserOperationRequestFunction,
} from "./updateUser";
import {
  uploadFileOperation,
  UploadFileOperationRequestFunction,
} from "./uploadFile";

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

export interface OperationRequestFunctionMap {
  addPet: AddPetOperationRequestFunction;
  updatePet: UpdatePetOperationRequestFunction;
  findPetsByStatus: FindPetsByStatusOperationRequestFunction;
  findPetsByTags: FindPetsByTagsOperationRequestFunction;
  getPetById: GetPetByIdOperationRequestFunction;
  updatePetWithForm: UpdatePetWithFormOperationRequestFunction;
  deletePet: DeletePetOperationRequestFunction;
  uploadFile: UploadFileOperationRequestFunction;
  getInventory: GetInventoryOperationRequestFunction;
  placeOrder: PlaceOrderOperationRequestFunction;
  getOrderById: GetOrderByIdOperationRequestFunction;
  deleteOrder: DeleteOrderOperationRequestFunction;
  createUser: CreateUserOperationRequestFunction;
  createUsersWithListInput: CreateUsersWithListInputOperationRequestFunction;
  loginUser: LoginUserOperationRequestFunction;
  logoutUser: LogoutUserOperationRequestFunction;
  getUserByName: GetUserByNameOperationRequestFunction;
  updateUser: UpdateUserOperationRequestFunction;
  deleteUser: DeleteUserOperationRequestFunction;
}

export const requestFunctionsBuilder = (
  requestAdapter: HttpRequestAdapter
): OperationRequestFunctionMap => ({
  addPet: requestFunctionBuilder(operations.addPet, requestAdapter),
  updatePet: requestFunctionBuilder(operations.updatePet, requestAdapter),
  findPetsByStatus: requestFunctionBuilder(
    operations.findPetsByStatus,
    requestAdapter
  ),
  findPetsByTags: requestFunctionBuilder(
    operations.findPetsByTags,
    requestAdapter
  ),
  getPetById: requestFunctionBuilder(operations.getPetById, requestAdapter),
  updatePetWithForm: requestFunctionBuilder(
    operations.updatePetWithForm,
    requestAdapter
  ),
  deletePet: requestFunctionBuilder(operations.deletePet, requestAdapter),
  uploadFile: requestFunctionBuilder(operations.uploadFile, requestAdapter),
  getInventory: requestFunctionBuilder(operations.getInventory, requestAdapter),
  placeOrder: requestFunctionBuilder(operations.placeOrder, requestAdapter),
  getOrderById: requestFunctionBuilder(operations.getOrderById, requestAdapter),
  deleteOrder: requestFunctionBuilder(operations.deleteOrder, requestAdapter),
  createUser: requestFunctionBuilder(operations.createUser, requestAdapter),
  createUsersWithListInput: requestFunctionBuilder(
    operations.createUsersWithListInput,
    requestAdapter
  ),
  loginUser: requestFunctionBuilder(operations.loginUser, requestAdapter),
  logoutUser: requestFunctionBuilder(operations.logoutUser, requestAdapter),
  getUserByName: requestFunctionBuilder(
    operations.getUserByName,
    requestAdapter
  ),
  updateUser: requestFunctionBuilder(operations.updateUser, requestAdapter),
  deleteUser: requestFunctionBuilder(operations.deleteUser, requestAdapter),
});

export const petServiceBuilder = (
  requestFunctions: OperationRequestFunctionMap
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
  requestFunctions: OperationRequestFunctionMap
) => ({
  getInventory: requestFunctions.getInventory,
  placeOrder: requestFunctions.placeOrder,
  getOrderById: requestFunctions.getOrderById,
  deleteOrder: requestFunctions.deleteOrder,
});

export const userServiceBuilder = (
  requestFunctions: OperationRequestFunctionMap
) => ({
  createUser: requestFunctions.createUser,
  createUsersWithListInput: requestFunctions.createUsersWithListInput,
  loginUser: requestFunctions.loginUser,
  logoutUser: requestFunctions.logoutUser,
  getUserByName: requestFunctions.getUserByName,
  updateUser: requestFunctions.updateUser,
  deleteUser: requestFunctions.deleteUser,
});
