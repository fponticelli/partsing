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
 * Error for missing field.
 */
export class ExpectedField {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-field' = 'expected-field'

  /**
   * Construct an instance of `ExpectedField`
   * @param field name of the missing field in a record/object.
   */
  constructor(readonly field: string) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `field "${this.field}"`
  }
}
