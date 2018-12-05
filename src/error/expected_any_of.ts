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
import { concatOr } from '../utils'

/**
 * Error for any {@link Entity} that should match at least one of the conditions
 * described in the `descriptions` array.
 */
export class ExpectedAnyOf {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-any-of' = 'expected-any-of'

  /**
   * Construct an instance of `ExpectedAnyOf`
   * @param entity
   * @param descriptions Human readable descriptions of all the missed matches.
   */
  constructor(readonly entity: Entity, readonly descriptions: string[]) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `any ${entityToString(this.entity, 1)} in ${concatOr(this.descriptions)}`
  }
}
