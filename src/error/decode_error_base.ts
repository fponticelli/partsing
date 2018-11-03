export abstract class DecodeErrorBase {
  // toStringWithInput(input: TextInput): string {
  //   const msg = this.toString()
  //   const length = Math.min(25, Math.max(msg.length, 10), input.input.length - input.index)
  //   const prefix = input.index === 0 ? '' : '…'
  //   const suffix = input.index < input.input.length - 1 ? '…' : ''
  //   const extract = input.input.substr(input.index, length)
  //   return `${msg} at "${prefix}${extract}${suffix}"`
  // }
  abstract toString(): string
}