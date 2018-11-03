import { DecodeErrorBase } from './decode_error_base'

export class UnexpectedEoi extends DecodeErrorBase {
  readonly kind: 'unexpected-eoi' = 'unexpected-eoi'
  constructor() {
    super()
  }
  toString() {
    return `unexpected end of input`
  }
}