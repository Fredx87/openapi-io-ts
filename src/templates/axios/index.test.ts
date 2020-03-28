import { ParserContext } from "../../parser-context";
import createApiTemplate from ".";
import mock from "./mock.json";

describe("templates", () => {
  it("generate getOrderById template", () => {
    const parserContext: ParserContext = (mock as unknown) as ParserContext;
    const apis = Object.values(parserContext.apis).flat();

    expect(createApiTemplate(apis)).toMatchInlineSnapshot(`
      "
              import axios from 'axios';
              import * as TE from 'fp-ts/lib/TaskEither';
              import { pipe } from 'fp-ts/lib/pipeable';
              import { ApiError, httpToApiError, decodeToParsingError } from './common';
              import * as models from './models';
          
              export function addPet(body: Pet): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(\`/pet\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function updatePet(body: Pet): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.put(\`/pet\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function findPetsByStatus(status: t.array(t.union([
        t.literal('available'),
        t.literal('pending'),
        t.literal('sold')
      ]))): TE.TaskEither<ApiError, t.array(Pet)> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/pet/findByStatus),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function findPetsByTags(tags: t.array(t.string)): TE.TaskEither<ApiError, t.array(Pet)> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/pet/findByTags),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function getPetById(petId: number): TE.TaskEither<ApiError, Pet> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/pet/\${petId}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function updatePetWithForm(petId: number): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(/pet/\${petId}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function deletePet(api_key: string, petId: number): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.delete(/pet/\${petId}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function uploadFile(petId: number): TE.TaskEither<ApiError, ApiResponse> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(/pet/\${petId}/uploadImage),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function getInventory(): TE.TaskEither<ApiError, Record<string, unknown>> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/store/inventory),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function placeOrder(body: Order): TE.TaskEither<ApiError, Order> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(\`/store/order\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function getOrderById(orderId: number): TE.TaskEither<ApiError, Order> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/store/order/\${orderId}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function deleteOrder(orderId: number): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.delete(/store/order/\${orderId}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function createUser(body: User): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(\`/user\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function createUsersWithArrayInput(body: t.array(User)): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(\`/user/createWithArray\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function createUsersWithListInput(body: t.array(User)): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.post(\`/user/createWithList\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function loginUser(username: string, password: string): TE.TaskEither<ApiError, string> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/user/login),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function logoutUser(): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/user/logout),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function getUserByName(username: string): TE.TaskEither<ApiError, User> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.get(/user/\${username}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function updateUser(username: string, body: User): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.put(\`/user/\${username}\`, body),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }
              export function deleteUser(username: string): TE.TaskEither<ApiError, unknown> {
                  return pipe(
                      TE.tryCatch(
                          () => axios.delete(/user/\${username}),
                          httpToApiError
                      ),
                      TE.chain(res => pipe(
                          TE.fromEither(models.Order.decode(res.data)),
                          TE.mapLeft(decodeToParsingError)
                      ))
                  )
              }"
    `);
  });
});
