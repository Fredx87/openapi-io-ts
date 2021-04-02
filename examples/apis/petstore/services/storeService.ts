import { HttpRequestAdapter } from "openapi-io-ts/dist/runtime";
import { getInventory } from "../operations/getInventory";
import { placeOrder } from "../operations/placeOrder";
import { getOrderById } from "../operations/getOrderById";
import { deleteOrder } from "../operations/deleteOrder";

export const storeServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  getInventory: getInventory(requestAdapter),
  placeOrder: placeOrder(requestAdapter),
  getOrderById: getOrderById(requestAdapter),
  deleteOrder: deleteOrder(requestAdapter),
});
