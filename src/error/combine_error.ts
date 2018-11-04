import { DecodeErrorBase } from './decode_error_base'
import { Entity, pluralize } from './entity'
import { DecodeError } from '.'

export class CombineError extends DecodeErrorBase {
  readonly kind: 'combine-error' = 'combine-error'
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