import { jsonNumber } from './parse_json'
import { TextParser, parse } from '../src/text_parser'

// const testParse = <T>(parser: TextParser<T>, serialized: string, expected: T) => {
//   const result = parse(parser, serialized);
//   console.log(result)
//   if (result.kind === 'parse-success') {
//     expect(result.value).toEqual(expected)
//   } else {
//     fail(`unable to parse '${serialized}' expected ${result.failure.expected}`)
//   }
// }

// const testFailedParse = <T>(parser: TextParser<T>, serialized: string) => {
  
// }

describe('JSONPrimitive', () => {
  it('nothing to test yet', () => {
    expect(1).toEqual(1)
    // testParse(jsonNumber, '123.456', 123.456)
  })
})