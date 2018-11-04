import { DecodeErrorBase } from './decode_error_base'

export class CustomError extends DecodeErrorBase {
  readonly kind: 'custom-error' = 'custom-error'
  constructor(readonly message: string) {
    super()
  }
  toString() {
    return this.message
  }
}