import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { ApiBody, ApiMethod, ParsedOperation } from "../../parser/parserOutput";
import {
  createUrlTemplate,
  generateFunctionArgs,
  getResponsesType,
} from "../common";

function createAxiosRequest(
  method: ApiMethod,
  path: string,
  body: O.Option<ApiBody>
) {
  return pipe(
    body,
    O.fold(
      () => `axios.${method}(\`${createUrlTemplate(path)}\`)`,
      (_: ApiBody) => `axios.${method}(\`${createUrlTemplate(path)}\`, body)`
    )
  );
}

function createApiTemplate(api: ParsedOperation): string {
  const { path, operationId: name, method, body, params, responses } = api;
  const request = createAxiosRequest(method, path, body);
  const fnArgs = generateFunctionArgs(params, body);
  const respType = getResponsesType(responses);

  // TODO: do not decode if api has not return type, use runtime type for decoding

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

export function generateAxiosApiTemplate(apis: ParsedOperation[]): string {
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
