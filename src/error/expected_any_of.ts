import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './Entity'

export const concatOr = (values: string[]) => {
  const length = values.length
  if (length === 0) {
    return '<empty>'
  } else if (length <= 2) {
    return values.join(' or ')
  } else {
    const last = values[length - 1]
    const head = values.slice(0, length - 1)
    return `${head.join(', ')} or ${last}`
  }
}

export class ExpectedAnyOf extends DecodeErrorBase {
  readonly kind: 'expected-any-of' = 'expected-any-of'
  constructor(
    readonly entity: Entity,
    readonly values: string[]
  ) {
    super()
  }
  toString() {
    return `expected any ${pluralize(this.entity, 1)} in ${concatOr(this.values)}`
  }
}