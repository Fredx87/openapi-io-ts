import * as t from "io-ts";

export const Category = t.type({
  id: t.number,
  name: t.string,
});

export interface Category {
  id: number;
  name: string;
}
