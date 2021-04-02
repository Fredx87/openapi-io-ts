import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/DateFromISOString";

export const Order = t.type({
  id: t.number,
  petId: t.number,
  quantity: t.number,
  shipDate: DateFromISOString,
  status: t.union([
    t.literal("placed"),
    t.literal("approved"),
    t.literal("delivered"),
  ]),
  complete: t.boolean,
});

export interface Order {
  id: number;
  petId: number;
  quantity: number;
  shipDate: Date;
  status: "placed" | "approved" | "delivered";
  complete: boolean;
}
