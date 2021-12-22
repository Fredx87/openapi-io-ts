export interface Endpoint {
  readonly parameters: Record<string, unknown>;
  readonly body?: unknown;
  readonly responses: Record<string, unknown>;
}
