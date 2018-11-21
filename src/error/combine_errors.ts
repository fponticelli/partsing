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

import { DecodeError } from './'
import { DecodeErrorBase } from './decode_error_base'

export class CombineErrors extends DecodeErrorBase {
  readonly kind: 'combine-errors' = 'combine-errors'
  constructor(
    readonly errors: DecodeError[]
  ) {
    super()
  }
  toString() {
    const errors: string = this.errors
                   .map(e => e.toString())
                   .map(s => `  - ${s}`)
                   .join('\n')
    return `expected one of:\n${errors}`
  }
}