# @openapi-io-ts/cli

## 0.2.0
### Minor Changes



- [#9](https://github.com/Fredx87/openapi-io-ts/pull/9) [`84d6bf1`](https://github.com/Fredx87/openapi-io-ts/commit/84d6bf1cc2cedc0f818fa3e88da71135ee94e58f) Thanks [@Fredx87](https://github.com/Fredx87)! - Changes in codegen for generating new request functions for runtime.
  
  **BREAKING CHANGE**
  The generated code will not have single request function anymore, but a single `requestFunctionsBuilder` function that creates all the request functions.
  The generated services builder will now take the object returned by the `requestFunctionsBuilder` function instead of an `HttpRequestAdapter`.

### Patch Changes



- [#11](https://github.com/Fredx87/openapi-io-ts/pull/11) [`355b111`](https://github.com/Fredx87/openapi-io-ts/commit/355b111d83cb308428f09f8bb6231bf3126bcc2c) Thanks [@Fredx87](https://github.com/Fredx87)! - Fixed a typo in response component generation
