import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './Entity'
export class ExpectedNoneOf extends DecodeErrorBase {
  readonly kind: 'no-char-of-error' = 'no-char-of-error'
  constructor(
    readonly entity: Entity,
    readonly values: string[]
  ) {
    super()
  }
  toString() {
    return `expected no ${pluralize(this.entity, 1)} of ${this.values.join(', ')}`
  }
}