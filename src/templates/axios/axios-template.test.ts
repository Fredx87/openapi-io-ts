import { helloWorldGen } from "./axios-template";
import mock from "./mock.json";
import { Api } from "../../parser-context";

import axios, { AxiosResponse } from "axios";
import t from "io-ts";
import TE from "fp-ts/lib/TaskEither";
import { Order } from "../../../out/models/Order";
import { pipe } from "fp-ts/lib/pipeable";
import { ResponseError } from "../types";

export function getOrderById(
  basePath: string,
  orderId: number
): TE.TaskEither<ResponseError, Order> {
  const request: TE.TaskEither<
    ResponseError,
    AxiosResponse<unknown>
  > = TE.tryCatch(
    () => axios.get(`${basePath}/store/order/${orderId}`),
    (e: any) => ({
      kind: "Http error",
      statusCode: e.statusCode,
      message: e.message
    })
  );
  return pipe(
    request,
    TE.chain(res =>
      pipe(
        TE.fromEither(Order.decode(res.data)),
        TE.mapLeft<any, ResponseError>(e => ({
          kind: "Parser error"
        }))
      )
    )
  );
}

describe("generate an hello world template", () => {
  it("teach me how to use handlefuckingbars", () => {
    const api: Api = {
      path: "/store/order/{orderId}",
      name: "getOrderById",
      method: "get",
      params: [
        {
          name: "orderId",
          type: {
            kind: "IntegerType",
            name: "Integer"
          },
          in: "path",
          required: true
        }
      ],
      body: {
        _tag: "None"
      },
      responses: [
        {
          code: "200",
          mediaType: "application/json",
          type: {
            kind: "Identifier",
            name: "Order"
          }
        }
      ]
    };

    const expected = `
            import axios from 'axios';
            import t from 'io-ts';
            import TE from 'fp-ts/lib/TaskEither';
            import { Order } from './models';
            import { pipe } from "fp-ts/lib/pipeable";
            
            export function getOrderById(basePath: string, orderId: number): TE.TaskEither<t.Errors, Order> {
                return pipe(TE.tryCatch)
                axios.get(\`\${basePath}\`/store/order/\`\${orderId}\`)
            }
        `;
  });
});
