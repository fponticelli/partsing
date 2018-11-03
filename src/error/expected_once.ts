import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './Entity'

export class ExpectedOnce extends DecodeErrorBase {
  readonly kind: 'one-entity-error' = 'one-entity-error'
  constructor(readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected a ${pluralize(this.entity, 1)}`
  }
}