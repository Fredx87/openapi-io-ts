import * as t from "io-ts";
import { Address } from "./Address";

export const Customer = t.partial({
  id: t.number,
  username: t.string,
  address: t.array(Address),
});

export interface Customer {
  id?: number;
  username?: string;
  address?: Array<Address>;
}
