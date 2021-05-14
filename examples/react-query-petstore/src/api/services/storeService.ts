import { HttpRequestAdapter } from "@openapi-io-ts/runtime";
import { deleteOrderBuilder } from "../operations/deleteOrder";
import { getInventoryBuilder } from "../operations/getInventory";
import { getOrderByIdBuilder } from "../operations/getOrderById";
import { placeOrderBuilder } from "../operations/placeOrder";

export const storeServiceBuilder = (requestAdapter: HttpRequestAdapter) => ({
  getInventory: getInventoryBuilder(requestAdapter),
  placeOrder: placeOrderBuilder(requestAdapter),
  getOrderById: getOrderByIdBuilder(requestAdapter),
  deleteOrder: deleteOrderBuilder(requestAdapter),
});
