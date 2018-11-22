/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  DecodeError,
  ExpectedAnyOf,
  ExpectedAtLeast,
  ExpectedEoi,
  ExpectedMatch,
  ExpectedNoneOf,
  ExpectedOnce,
  PatternMismatch
} from '../../src/error'
import {
  char,
  decodeText,
  digit,
  digits,
  eoi,
  letter,
  letters,
  lowerCaseLetter,
  lowerCaseLetters,
  match,
  matchAnyCharOf,
  matchInsensitive,
  matchNoCharOf,
  optionalWhitespace,
  regexp,
  rest,
  takeCharBetween,
  takeCharWhile,
  testChar,
  TextDecoder,
  upperCaseLetter,
  upperCaseLetters,
  whitespace,
  withPosition
} from '../../src/text'
import { TextInput } from '../../src/text/input'

const decodeSuccess = <Out>(decoder: TextDecoder<Out>, input: string): [TextInput, Out] => {
  const r = decoder.run({ input, index: 0 })
  if (r.isFailure()) {
    throw 'expected decode success'
  } else {
    return [r.input, r.value]
  }
}

const decodeFailure = <Out>(decoder: TextDecoder<Out>, input: string): [TextInput, DecodeError] => {
  const r = decoder.run({ input, index: 0 })
  if (r.isSuccess()) {
    throw 'expected decode failure'
  } else {
    return [r.input, r.failure]
  }
}

describe('text_decoder', () => {
  it('regexp', () => {
    const p = regexp(/(\d+)/, 1)
    expect(decodeText(p)('abc').isFailure()).toEqual(true)
    const [input, decoded] = decodeSuccess(p, 'a123b')
    expect(input.index).toEqual(4)
    expect(decoded).toEqual('123')
  })

  it('regexp with group', () => {
    const p = regexp(/a(\d+)b/g, 1)
    const [input, decoded] = decodeSuccess(p.join(p), '--a123b-a456b--')
    expect(input.index).toEqual(13)
    expect(decoded).toEqual(['123', '456'])
  })

  it('regexp matching from start', () => {
    const p = regexp(/^\d+/g)
    const [input, failure] = decodeFailure(p, 'a123b')
    expect(input.index).toEqual(0)
    expect(failure).toBeInstanceOf(PatternMismatch)
    const [input2, decoded] = decodeSuccess(p, '123')
    expect(input2.index).toEqual(3)
    expect(decoded).toEqual('123')
  })

  it('regexp matching from start without global', () => {
    const p = regexp(/^\d+/)
    const [input, failure] = decodeFailure(p, 'a123b')
    expect(input.index).toEqual(0)
    expect(failure).toBeInstanceOf(PatternMismatch)
    const [input2, decoded] = decodeSuccess(p, '123')
    expect(input2.index).toEqual(3)
    expect(decoded).toEqual('123')
  })

  it('withFailure changes error message', () => {
    const p = regexp(/^\d+/g).withFailure(DecodeError.custom('number'))
    const [input, failure] = decodeFailure(p, 'a123b')
    expect(failure.toString()).toEqual('number')
  })

  it('withPosition', () => {
    const p = regexp(/\d+/g)
    const [, decoded] = decodeSuccess(p.pickNext(withPosition), 'a123b')
    expect(decoded).toEqual(4)
  })

  it('rest', () => {
    const p = regexp(/\d+/g)
    const [, decoded] = decodeSuccess(p.pickNext(rest), 'a123b')
    expect(decoded).toEqual('b')
  })

  it('eoi', () => {
    const [, decoded] = decodeSuccess(rest.skipNext(eoi), 'a123b')
    expect(decoded).toEqual('a123b')
    const [, failure] = decodeFailure(eoi, 'a123b')
    expect(failure).toBeInstanceOf(ExpectedEoi)
  })

  it('match', () => {
    const [, decoded] = decodeSuccess(match('a12'), 'a123b')
    expect(decoded).toEqual('a12')
    const [, failure] = decodeFailure(match('abc'), 'a123b')
    expect(failure).toBeInstanceOf(ExpectedMatch)
  })

  it('matchInsensitive', () => {
    const [, decoded] = decodeSuccess(matchInsensitive('abc'), 'AbCd')
    expect(decoded).toEqual('AbC')
    const [, failure] = decodeFailure(matchInsensitive('abc'), 'a123b')
    expect(failure).toBeInstanceOf(ExpectedMatch)
  })

  it('letter', () => {
    const [, decoded] = decodeSuccess(letter, 'a123b')
    expect(decoded).toEqual('a')
    const [, failure] = decodeFailure(letter, '123')
    expect(failure).toBeInstanceOf(ExpectedOnce)
  })

  it('letters', () => {
    const [, decoded] = decodeSuccess(letters(), 'abc123')
    expect(decoded).toEqual('abc')
    const [, decoded1] = decodeSuccess(letters(0), 'abc123')
    expect(decoded1).toEqual('abc')
    const [, failure2] = decodeFailure(letters(1), '123abc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, decoded3] = decodeSuccess(letters(0, 2), 'abc123')
    expect(decoded3).toEqual('ab')
    const [, failure4] = decodeFailure(letters(3, 4), 'ab123')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('lowerCaseLetter', () => {
    const [, decoded] = decodeSuccess(lowerCaseLetter, 'a123b')
    expect(decoded).toEqual('a')
    const [, failure] = decodeFailure(lowerCaseLetter, 'AB')
    expect(failure).toBeInstanceOf(ExpectedOnce)
  })

  it('lowerCaseLetters', () => {
    const [, decoded] = decodeSuccess(lowerCaseLetters(), 'abcABC')
    expect(decoded).toEqual('abc')
    const [, decoded1] = decodeSuccess(lowerCaseLetters(0), 'abcABC')
    expect(decoded1).toEqual('abc')
    const [, failure2] = decodeFailure(lowerCaseLetters(1), 'ABCabc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, decoded3] = decodeSuccess(lowerCaseLetters(0, 2), 'abcABC')
    expect(decoded3).toEqual('ab')
    const [, failure4] = decodeFailure(lowerCaseLetters(3, 4), 'abABC')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('upperCaseLetter', () => {
    const [, decoded] = decodeSuccess(upperCaseLetter, 'AabcB')
    expect(decoded).toEqual('A')
    const [, failure] = decodeFailure(upperCaseLetter, 'abc')
    expect(failure).toBeInstanceOf(ExpectedOnce)
  })

  it('upperCaseLetters', () => {
    const [, decoded] = decodeSuccess(upperCaseLetters(), 'ABCabc')
    expect(decoded).toEqual('ABC')
    const [, decoded1] = decodeSuccess(upperCaseLetters(0), 'ABCabc')
    expect(decoded1).toEqual('ABC')
    const [, failure2] = decodeFailure(upperCaseLetters(1), 'abcABC')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, decoded3] = decodeSuccess(upperCaseLetters(0, 2), 'ABCabc')
    expect(decoded3).toEqual('AB')
    const [, failure4] = decodeFailure(upperCaseLetters(3, 4), 'ABabc')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('digit', () => {
    const [, decoded] = decodeSuccess(digit, '123abc')
    expect(decoded).toEqual('1')
    const [, failure] = decodeFailure(digit, 'abc')
    expect(failure).toBeInstanceOf(ExpectedOnce)
  })

  it('digits', () => {
    const [, decoded0] = decodeSuccess(digits(), '123abc')
    expect(decoded0).toEqual('123')
    const [, decoded1] = decodeSuccess(digits(0), '123abc')
    expect(decoded1).toEqual('123')
    const [, decoded2] = decodeSuccess(digits(3, 4), '123abc')
    expect(decoded2).toEqual('123')
    const [, failure] = decodeFailure(digits(1), 'abc123')
    expect(failure).toBeInstanceOf(ExpectedAtLeast)
    const [, failure2] = decodeFailure(digits(3, 4), '12abc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
  })

  it('whitespace', () => {
    const [, decoded] = decodeSuccess(whitespace, '  abc')
    expect(decoded).toEqual('  ')
    const [, failure] = decodeFailure(whitespace, 'abc')
    expect(failure).toBeInstanceOf(ExpectedAtLeast)
  })

  it('optionalWhitespace', () => {
    const [, decoded] = decodeSuccess(optionalWhitespace, '  123')
    expect(decoded).toEqual('  ')
    const [, decoded2] = decodeSuccess(optionalWhitespace, '123')
    expect(decoded2).toEqual('')
  })

  it('char', () => {
    const [, decoded] = decodeSuccess(char, 'abc')
    expect(decoded).toEqual('a')
    const [, failure] = decodeFailure(char, '')
    expect(failure).toBeInstanceOf(ExpectedOnce)
  })

  it('testChar', () => {
    const [, decoded] = decodeSuccess(testChar(v => v === 'a'), 'abc')
    expect(decoded).toEqual('a')
    const [, failure] = decodeFailure(testChar(v => v === 'a'), 'bcd')
    expect(failure).toBeDefined()
    const [, failure3] = decodeFailure(testChar(v => v === 'a'), '')
    expect(failure3).toBeDefined()
  })

  it('matchAnyCharOf', () => {
    const [, decoded1] = decodeSuccess(matchAnyCharOf('abc'), 'cxy')
    expect(decoded1).toEqual('c')
    const [, failure] = decodeFailure(matchAnyCharOf('abc'), 'xyz')
    expect(failure).toBeInstanceOf(ExpectedAnyOf)
  })

  it('matchNoCharOf', () => {
    const [, decoded1] = decodeSuccess(matchNoCharOf('abc'), 'xyz')
    expect(decoded1).toEqual('x')
    const [, failure] = decodeFailure(matchNoCharOf('abc'), 'cxy')
    expect(failure).toBeInstanceOf(ExpectedNoneOf)
  })

  it('takeCharWhile', () => {
    const [, decoded1] = decodeSuccess(takeCharWhile(v => v.toLowerCase() === v), 'xyZ')
    expect(decoded1).toEqual('xy')
    const [, failure2] = decodeFailure(takeCharWhile(v => v.toLowerCase() === v), 'XYZ')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, failure3] = decodeFailure(takeCharWhile(v => v.toLowerCase() === v, 2), 'xYZ')
    expect(failure3).toBeDefined()
  })

  it('takeCharBetween', () => {
    const [, decoded1] = decodeSuccess(takeCharBetween(v => v.toLowerCase() === v, 2, 3), 'xyzabc')
    expect(decoded1).toEqual('xyz')
    const [, failure2] = decodeFailure(takeCharBetween(v => v.toLowerCase() === v, 2, 3), 'xYZ')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, failure3] = decodeFailure(takeCharBetween(v => v.toLowerCase() === v, 2, 3), '')
    expect(failure3).toBeDefined()
  })
})
