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
 * Expected error for a decoder that wasn't able to match `pattern`.
 */
export class PatternMismatch {
  /**
   * Type discriminator
   */
  readonly kind: 'pattern-mismatch' = 'pattern-mismatch'

  /**
   * Construct an instance of `PatternMismatch`.
   * @param pattern Human readeable description of the pattern that wasn't matched.
   */
  constructor(readonly pattern: string) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `to match pattern ${this.pattern}`
  }
}
