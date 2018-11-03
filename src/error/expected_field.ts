import { DecodeErrorBase } from './decode_error_base'
export class ExpectedField extends DecodeErrorBase {
  readonly kind: 'expected-field' = 'expected-field'
  constructor(readonly field: string) {
    super()
  }
  toString() {
    return `expected field "${this.field}"`
  }
}