import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './Entity'

export const concatOr = (values: string[]) => {
  return [values.slice(0, values.length - 1).join(', ')]
    .concat(values.slice(values.length - 1)).join(' or ') 
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