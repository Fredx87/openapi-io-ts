import * as t from "io-ts";
import * as schemas from "./";

export const Pet = t.intersection([
  t.type({
    name: t.string,
    photoUrls: t.array(t.string),
  }),
  t.partial({
    id: t.number,
    category: schemas.Category,
    tags: t.array(schemas.Tag),
    status: t.union([
      t.literal("available"),
      t.literal("pending"),
      t.literal("sold"),
    ]),
  }),
]);

export interface Pet {
  id?: number;
  category?: schemas.Category;
  name: string;
  photoUrls: Array<string>;
  tags?: Array<schemas.Tag>;
  status?: "available" | "pending" | "sold";
}
