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
 * Error for an {@link Entity} that was not repeated at least `min` times.
 */
export class ExpectedAtLeast {
  /**
   * Type discriminator
   */
  readonly kind: 'expected-at-least' = 'expected-at-least'
  constructor(readonly min: number, readonly entity: Entity) {}

  /**
   * Prvide a human readable representation of the value. Mostly for debugging.
   */
  toString() {
    return `expected at least ${this.min} ${entityToString(this.entity, this.min)}`
  }
}
