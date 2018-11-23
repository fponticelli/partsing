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

import { Entity, entityToString } from './entity'

/**
 * Utility function to generate a comma separate list of values where the last
 * one is concatenated by `or`.
 */
export const concatOr = (values: string[]) => {
  const length = values.length
  if (length === 0) {
    return '<empty>'
  } else if (length <= 2) {
    return values.join(' or ')
  } else {
    const last = values[length - 1]
    const head = values.slice(0, length - 1)
    return `${head.join(', ')} or ${last}`
  }
}

/**
 * Error for any {@link Entity} that should match at least one of the conditions
 * described in the `descriptions` array.
 */
export class ExpectedAnyOf {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-any-of' = 'expected-any-of'
  constructor(readonly entity: Entity, readonly descriptions: string[]) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `expected any ${entityToString(this.entity, 1)} in ${concatOr(this.descriptions)}`
  }
}
