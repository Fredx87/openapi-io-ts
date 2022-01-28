---
"@openapi-io-ts/runtime": minor
---

Changed types of request functions and operations.

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
