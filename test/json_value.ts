export type JSONPrimitive = string | number | null | undefined
export interface JSONObject extends Record<string, JSONValue> {}
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue = JSONPrimitive | JSONArray | JSONObject