import { HttpRequestAdapter } from "@openapi-io-ts/runtime";
import { servers } from "../api/servers";

export const fetchRequestAdapter: HttpRequestAdapter = (url, init) =>
  fetch(`http://localhost:8080/api${servers[0]}${url}`, init);
