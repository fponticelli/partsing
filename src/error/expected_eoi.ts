import { DecodeErrorBase } from './decode_error_base'

export class ExpectedEoi extends DecodeErrorBase {
  readonly kind: 'expected-eot' = 'expected-eot'
  constructor() {
    super()
  }
  toString() {
    return `expected end of input`
  }
}