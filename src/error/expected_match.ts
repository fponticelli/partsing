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
 * Error for an exact match that failed. The expectation is described as a
 * string.
 */
export class ExpectedMatch {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-match' = 'expected-match'

  /**
   * Construct an instance of `ExpectedMatch`
   * @param entity type of the entity to be matched
   * @param value Human readable description of the missed match.
   */
  constructor(readonly entity: Entity, readonly value: string) {}

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `${this.value} (${entityToString(this.entity, 1)})`
  }
}
