import { regexp, expect } from '../src/text_parser'
export const jsonNumber = expect(
  'number',
  regexp(/^-?(0|[1-9]\d*)([.]\d+)?([eE][+-]?\d+)?/g).map(Number)
)