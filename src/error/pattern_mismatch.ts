import { DecodeErrorBase } from './decode_error_base'

export class PatternMismatch extends DecodeErrorBase {
  readonly kind: 'pattern-mismatch' = 'pattern-mismatch'
  constructor(readonly pattern: string) {
    super()
  }
  toString() {
    return `doesn't match pattern ${this.pattern}`
  }
}