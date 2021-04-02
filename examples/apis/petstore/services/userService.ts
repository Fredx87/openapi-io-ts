import { HttpRequestAdapter } from "openapi-io-ts/dist/runtime";
import { createUser } from "../operations/createUser";
import { createUsersWithArrayInput } from "../operations/createUsersWithArrayInput";
import { createUsersWithListInput } from "../operations/createUsersWithListInput";
import { loginUser } from "../operations/loginUser";
import { logoutUser } from "../operations/logoutUser";
import { getUserByName } from "../operations/getUserByName";
import { updateUser } from "../operations/updateUser";
import { deleteUser } from "../operations/deleteUser";

export const userServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  createUser: createUser(requestAdapter),
  createUsersWithArrayInput: createUsersWithArrayInput(requestAdapter),
  createUsersWithListInput: createUsersWithListInput(requestAdapter),
  loginUser: loginUser(requestAdapter),
  logoutUser: logoutUser(requestAdapter),
  getUserByName: getUserByName(requestAdapter),
  updateUser: updateUser(requestAdapter),
  deleteUser: deleteUser(requestAdapter),
});
