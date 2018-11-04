import { DecodeErrorBase } from './decode_error_base'

export class PatternMismatch extends DecodeErrorBase {
  readonly kind: 'pattern-mismatch' = 'pattern-mismatch'
  constructor(readonly pattern: string) {
    super()
  }
  toString() {
    return `expected to match pattern ${this.pattern}`
  }
}