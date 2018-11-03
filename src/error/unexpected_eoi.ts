import { DecodeErrorBase } from './decode_error_base'

export class UnexpectedEoi extends DecodeErrorBase {
  readonly kind: 'unexpected-eot-error' = 'unexpected-eot-error'
  constructor() {
    super()
  }
  toString() {
    return `unexpected end of input`
  }
}