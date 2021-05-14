import { HttpRequestAdapter } from "@openapi-io-ts/runtime";
import { createUserBuilder } from "../operations/createUser";
import { createUsersWithListInputBuilder } from "../operations/createUsersWithListInput";
import { deleteUserBuilder } from "../operations/deleteUser";
import { getUserByNameBuilder } from "../operations/getUserByName";
import { loginUserBuilder } from "../operations/loginUser";
import { logoutUserBuilder } from "../operations/logoutUser";
import { updateUserBuilder } from "../operations/updateUser";

export const userServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  createUser: createUserBuilder(requestAdapter),
  createUsersWithListInput: createUsersWithListInputBuilder(requestAdapter),
  loginUser: loginUserBuilder(requestAdapter),
  logoutUser: logoutUserBuilder(requestAdapter),
  getUserByName: getUserByNameBuilder(requestAdapter),
  updateUser: updateUserBuilder(requestAdapter),
  deleteUser: deleteUserBuilder(requestAdapter),
});
