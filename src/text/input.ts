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
 * `TextInput` stores the entire `input` value as a `string` and contains
 * an `index` as the current character position inside the stream.
 */
export interface TextInput {
  /**
   * The string input. Its value is never modified by the decoders at any point
   * in the chain.
   */
  readonly input: string

  /**
   * The current position reached by a decoder.
   */
  readonly index: number
}
