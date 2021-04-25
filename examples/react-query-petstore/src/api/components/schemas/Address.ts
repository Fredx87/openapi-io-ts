import * as t from "io-ts";

export const Address = t.partial({
  street: t.string,
  city: t.string,
  state: t.string,
  zip: t.string,
});

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}
