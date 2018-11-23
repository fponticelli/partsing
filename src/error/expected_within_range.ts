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
 * Error for a decoder that should have captured a value between twp values
 * as described in `min` and `max`.
 */
export class ExpectedWithinRange {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-within-range' = 'expected-within-range'

  /**
   * Construct an instance of `ExpectedWithinRange`.
   * @param min minimum number of occurrances expected (inclusive).
   * @param max maximum number of occurrances expected (inclusive).
   */
  constructor(readonly min: string, readonly max: string) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `expected between ${this.min} and ${this.max}`
  }
}
