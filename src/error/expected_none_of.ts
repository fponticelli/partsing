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
 * Error for a decoder that is expected to fail decoding an {@link Entity} for
 * any of the values as they are described in the `descriptions` array.
 */
export class ExpectedNoneOf {
  /**
   * Type discriminator
   */
  readonly kind: 'none-of-error' = 'none-of-error'

  /**
   * Construct an instance of `ExpectedNoneOf`
   * @param entity
   * @param descriptions Human readable descriptions of the conditions that should
   * not have been matched.
   */
  constructor(readonly entity: Entity, readonly descriptions: string[]) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `no ${entityToString(this.entity, 1)} like ${concatOr(this.descriptions)}`
  }
}
