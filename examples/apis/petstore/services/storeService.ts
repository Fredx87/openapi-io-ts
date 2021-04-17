import { HttpRequestAdapter } from "openapi-io-ts/dist/runtime";
import { deleteOrder } from "../operations/deleteOrder";
import { getInventory } from "../operations/getInventory";
import { getOrderById } from "../operations/getOrderById";
import { placeOrder } from "../operations/placeOrder";

export const storeServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  getInventory: getInventory(requestAdapter),
  placeOrder: placeOrder(requestAdapter),
  getOrderById: getOrderById(requestAdapter),
  deleteOrder: deleteOrder(requestAdapter),
});
