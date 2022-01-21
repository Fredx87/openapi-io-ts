---
"@openapi-io-ts/runtime": minor
---

Changed types of request functions and operations.

**BREAKING CHANGE**
Request functions now have only one parameter: an object containing `params` and `body` (they can be optional if the operation
does not have parameters or body).
