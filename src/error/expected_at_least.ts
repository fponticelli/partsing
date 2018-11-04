import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './entity'

export class ExpectedAtLeast extends DecodeErrorBase {
  readonly kind: 'expected-at-least' = 'expected-at-least'
  constructor(readonly min: number, readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected at least ${this.min} ${pluralize(this.entity, this.min)}`
  }
}