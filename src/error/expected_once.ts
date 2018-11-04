import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './entity'

export class ExpectedOnce extends DecodeErrorBase {
  readonly kind: 'expected-once' = 'expected-once'
  constructor(readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected a ${pluralize(this.entity, 1)}`
  }
}