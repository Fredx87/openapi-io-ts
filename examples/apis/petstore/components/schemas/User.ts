import * as t from "io-ts";

export const User = t.type({
  id: t.number,
  username: t.string,
  firstName: t.string,
  lastName: t.string,
  email: t.string,
  password: t.string,
  phone: t.string,
  userStatus: t.number,
});

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
}
