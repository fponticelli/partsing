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