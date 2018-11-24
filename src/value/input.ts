/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * `ValueInput` stores the current `input` value as a `any` (any JS value) and
 * contains a `path` value to identify the position in the current context.
 *
 * `path` is an array of either `string` values (field names of an object) or
 * `number` values (index inside an array).
 */
export interface ValueInput {
  readonly input: any
  readonly path: (string | number)[]
}
