import { DecodeErrorBase } from './decode_error_base'

export class ExpectedEOI extends DecodeErrorBase {
  readonly kind: 'expected-eot-error' = 'expected-eot-error'
  constructor() {
    super()
  }
  toString() {
    return `expected end of input`
  }
}