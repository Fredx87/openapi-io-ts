---
"@openapi-io-ts/cli": minor
---

Changes in codegen for generating new request functions for runtime.

**BREAKING CHANGE**
The generated code will not have single request function anymore, but a single `requestFunctionsBuilder` function that creates all the request functions.
The generated services builder will now take the object returned by the `requestFunctionsBuilder` function instead of an `HttpRequestAdapter`.
