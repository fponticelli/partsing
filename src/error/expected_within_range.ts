import { DecodeErrorBase } from './decode_error_base'

export class ExpectedWithinRange extends DecodeErrorBase {
  readonly kind: 'expected-within-range' = 'expected-within-range'
  constructor(readonly min: string, readonly max: string) {
    super()
  }
  toString() {
    return `expected between ${this.min} and ${this.max}`
  }
}