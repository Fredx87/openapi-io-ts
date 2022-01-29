import {
  HttpRequestAdapter,
  RequestFunction,
  RequestFunctionArgs,
  requestFunctionBuilder,
} from "@openapi-io-ts/runtime";
import { fetchRequestAdapter } from "../../common/fetchRequestAdapter";
import { addPetOperation, AddPetRequestFunction } from "./addPet";
import { createUserOperation, CreateUserRequestFunction } from "./createUser";
import {
  createUsersWithListInputOperation,
  CreateUsersWithListInputRequestFunction,
} from "./createUsersWithListInput";
import {
  deleteOrderOperation,
  DeleteOrderRequestFunction,
} from "./deleteOrder";
import { deletePetOperation, DeletePetRequestFunction } from "./deletePet";
import { deleteUserOperation, DeleteUserRequestFunction } from "./deleteUser";
import {
  findPetsByStatusOperation,
  FindPetsByStatusRequestFunction,
} from "./findPetsByStatus";
import {
  findPetsByTagsOperation,
  FindPetsByTagsRequestFunction,
} from "./findPetsByTags";
import {
  getInventoryOperation,
  GetInventoryRequestFunction,
} from "./getInventory";
import {
  getOrderByIdOperation,
  GetOrderByIdRequestFunction,
} from "./getOrderById";
import { getPetByIdOperation, GetPetByIdRequestFunction } from "./getPetById";
import {
  getUserByNameOperation,
  GetUserByNameRequestFunction,
} from "./getUserByName";
import { loginUserOperation, LoginUserRequestFunction } from "./loginUser";
import { logoutUserOperation, LogoutUserRequestFunction } from "./logoutUser";
import { placeOrderOperation, PlaceOrderRequestFunction } from "./placeOrder";
import { updatePetOperation, UpdatePetRequestFunction } from "./updatePet";
import {
  updatePetWithFormOperation,
  UpdatePetWithFormRequestFunction,
} from "./updatePetWithForm";
import { updateUserOperation, UpdateUserRequestFunction } from "./updateUser";
import { uploadFileOperation, UploadFileRequestFunction } from "./uploadFile";

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
  addPet: AddPetRequestFunction;
  updatePet: UpdatePetRequestFunction;
  findPetsByStatus: FindPetsByStatusRequestFunction;
  findPetsByTags: FindPetsByTagsRequestFunction;
  getPetById: GetPetByIdRequestFunction;
  updatePetWithForm: UpdatePetWithFormRequestFunction;
  deletePet: DeletePetRequestFunction;
  uploadFile: UploadFileRequestFunction;
  getInventory: GetInventoryRequestFunction;
  placeOrder: PlaceOrderRequestFunction;
  getOrderById: GetOrderByIdRequestFunction;
  deleteOrder: DeleteOrderRequestFunction;
  createUser: CreateUserRequestFunction;
  createUsersWithListInput: CreateUsersWithListInputRequestFunction;
  loginUser: LoginUserRequestFunction;
  logoutUser: LogoutUserRequestFunction;
  getUserByName: GetUserByNameRequestFunction;
  updateUser: UpdateUserRequestFunction;
  deleteUser: DeleteUserRequestFunction;
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
