import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { Api, ApiBody, ApiMethod } from "../../parser/parserState";
import {
  createUrlTemplate,
  generateFunctionArgs,
  getResponsesType
} from "../common";

function createAxiosRequest(
  method: ApiMethod,
  path: string,
  body: O.Option<ApiBody>
) {
  return pipe(
    body,
    O.fold(
      () => `axios.${method}(${createUrlTemplate(path)})`,
      (_: ApiBody) => `axios.${method}(\`${createUrlTemplate(path)}\`, body)`
    )
  );
}

function createApiTemplate(api: Api): string {
  const { path, name, method, body, params, responses } = api;
  const request = createAxiosRequest(method, path, body);
  const fnArgs = generateFunctionArgs(params, body);
  const respType = getResponsesType(responses);

  return `
        export function ${name}(${fnArgs}): TE.TaskEither<ApiError, ${respType}> {
            return pipe(
                TE.tryCatch(
                    () => ${request},
                    httpToApiError
                ),
                TE.chain(res => pipe(
                    TE.fromEither(models.Order.decode(res.data)),
                    TE.mapLeft(decodeToParsingError)
                ))
            )
        }`;
}

export function generateAxiosApiTemplate(apis: Api[]): string {
  let template = `
        import axios from 'axios';
        import * as TE from 'fp-ts/lib/TaskEither';
        import { pipe } from 'fp-ts/lib/pipeable';
        import { ApiError, httpToApiError, decodeToParsingError } from './common';
        import * as models from './models';
    `;

  for (const api of apis) {
    template += createApiTemplate(api);
  }

  return template;
}
