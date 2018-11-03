import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './Entity'

export class ExpectedAnyOf extends DecodeErrorBase {
  readonly kind: 'any-of-error' = 'any-of-error'
  constructor(
    readonly entity: Entity,
    readonly values: string[]
  ) {
    super()
  }
  toString() {
    return `expected any ${pluralize(this.entity, 1)} of ${this.values.join(', ')}`
  }
}