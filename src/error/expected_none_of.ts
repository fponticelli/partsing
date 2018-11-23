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

import { Entity, pluralize } from './entity'
import { concatOr } from './expected_any_of'

export class ExpectedNoneOf {
  readonly kind: 'no-char-of-error' = 'no-char-of-error'
  constructor(readonly entity: Entity, readonly values: string[]) {}
  toString() {
    return `no ${pluralize(this.entity, 1)} like ${concatOr(this.values)}`
  }
}
