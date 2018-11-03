import { DecodeErrorBase } from './decode_error_base'
export class ExpectedMatch extends DecodeErrorBase {
  readonly kind: 'expected-match' = 'expected-match'
  constructor(readonly value: string) {
    super()
  }
  toString() {
    return `expected ${this.value}`
  }
}