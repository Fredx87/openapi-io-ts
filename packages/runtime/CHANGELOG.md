# @openapi-io-ts/runtime

## 0.2.0
### Minor Changes



- [#9](https://github.com/Fredx87/openapi-io-ts/pull/9) [`84d6bf1`](https://github.com/Fredx87/openapi-io-ts/commit/84d6bf1cc2cedc0f818fa3e88da71135ee94e58f) Thanks [@Fredx87](https://github.com/Fredx87)! - Changed types of request functions and operations.
  
  **BREAKING CHANGE**
  Request functions now have only one parameter: an object containing `params` and `body` (they can be optional if the operation
  does not have parameters or body).
  
  Example of operation with `{ id: string }` params and `{name: string; age: number }` body:
  
  ```ts
  // Before:
  operation({ id: "abc123" }, { name: "Jonh Doe", age: 35 });
  // After:
  operation({ params: { id: "abc123" }, body: { name: "Jonh Doe", age: 35 } });
  ```
