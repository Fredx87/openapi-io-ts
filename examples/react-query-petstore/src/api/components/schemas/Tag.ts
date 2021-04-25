import * as t from "io-ts";

export const Tag = t.partial({
  id: t.number,
  name: t.string,
});

export interface Tag {
  id?: number;
  name?: string;
}
