import {
  char,
  digit,
  digits,
  eot,
  withPosition,
  letter,
  letters,
  lowerCaseLetter,
  lowerCaseLetters,
  upperCaseLetter,
  upperCaseLetters,
  match,
  matchNoCharOf,
  matchAnyCharOf,
  optionalWhitespace,
  parseText,
  regexp,
  rest,
  takeCharBetween,
  takeCharWhile,
  testChar,
  TextParser,
  whitespace
} from '../../src/text'

import { TextInput } from '../../src/text/input'

import {
  TextError,
  ExpectedAtLeast,
  NoCharOfError,
  AnyCharOfError,
  OneEntityError,
  MatchError,
  ExpectedEOTError,
  RegExpError
} from '../../src/text/error'

const parseSuccess = <Out>(parser: TextParser<Out>, input: string): [TextInput, Out] => {
  const r = parseText(parser, input)
  if (r.isFailure()) {
    throw 'expected parse success'
  } else {
    return [r.input, r.value]
  }
}

const parseFailure = <Out>(parser: TextParser<Out>, input: string): [TextInput, TextError] => {
  const r = parseText(parser, input)
  if (r.isSuccess()) {
    throw 'expected parse failure'
  } else {
    return [r.input, r.failure]
  }
}

describe('text_parser', () => {
  it('regexp', () => {
    const p = regexp(/(\d+)/, 1)
    expect(parseText(p, 'abc').isFailure()).toEqual(true)
    const [input, parsed] = parseSuccess(p, 'a123b')
    expect(input.index).toEqual(4)
    expect(parsed).toEqual('123')
  })

  it('regexp with group', () => {
    const p = regexp(/a(\d+)b/g, 1)
    const [input, parsed] = parseSuccess(p.join(p), '--a123b-a456b--')
    expect(input.index).toEqual(13)
    expect(parsed).toEqual(['123', '456'])
  })

  it('regexp matching from start', () => {
    const p = regexp(/^\d+/g)
    const [input, failure] = parseFailure(p, 'a123b')
    expect(input.index).toEqual(0)
    expect(failure).toBeInstanceOf(RegExpError)
    const [input2, parsed] = parseSuccess(p, '123')
    expect(input2.index).toEqual(3)
    expect(parsed).toEqual('123')
  })

  it('regexp matching from start without global', () => {
    const p = regexp(/^\d+/)
    const [input, failure] = parseFailure(p, 'a123b')
    expect(input.index).toEqual(0)
    expect(failure).toBeInstanceOf(RegExpError)
    const [input2, parsed] = parseSuccess(p, '123')
    expect(input2.index).toEqual(3)
    expect(parsed).toEqual('123')
  })

  it('withFailure changes error message', () => {
    const p = regexp(/^\d+/g).withFailure(TextError.custom('number'))
    const [input, failure] = parseFailure(p, 'a123b')
    expect(failure.toString()).toEqual('number')
  })

  it('withPosition', () => {
    const p = regexp(/\d+/g)
    const [, parsed] = parseSuccess(p.pickNext(withPosition), 'a123b')
    expect(parsed).toEqual(4)
  })

  it('rest', () => {
    const p = regexp(/\d+/g)
    const [, parsed] = parseSuccess(p.pickNext(rest), 'a123b')
    expect(parsed).toEqual('b')
  })

  it('eot', () => {
    const [, parsed] = parseSuccess(rest.skipNext(eot), 'a123b')
    expect(parsed).toEqual('a123b')
    const [, failure] = parseFailure(eot, 'a123b')
    expect(failure).toBeInstanceOf(ExpectedEOTError)
  })

  it('match', () => {
    const [, parsed] = parseSuccess(match('a12'), 'a123b')
    expect(parsed).toEqual('a12')
    const [, failure] = parseFailure(match('abc'), 'a123b')
    expect(failure).toBeInstanceOf(MatchError)
  })

  it('letter', () => {
    const [, parsed] = parseSuccess(letter, 'a123b')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(letter, '123')
    expect(failure).toBeInstanceOf(OneEntityError)
  })

  it('letters', () => {
    const [, parsed] = parseSuccess(letters(), 'abc123')
    expect(parsed).toEqual('abc')
    const [, parsed1] = parseSuccess(letters(0), 'abc123')
    expect(parsed1).toEqual('abc')
    const [, failure2] = parseFailure(letters(1), '123abc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, parsed3] = parseSuccess(letters(0, 2), 'abc123')
    expect(parsed3).toEqual('ab')
    const [, failure4] = parseFailure(letters(3, 4), 'ab123')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('lowerCaseLetter', () => {
    const [, parsed] = parseSuccess(lowerCaseLetter, 'a123b')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(lowerCaseLetter, 'AB')
    expect(failure).toBeInstanceOf(OneEntityError)
  })

  it('lowerCaseLetters', () => {
    const [, parsed] = parseSuccess(lowerCaseLetters(), 'abcABC')
    expect(parsed).toEqual('abc')
    const [, parsed1] = parseSuccess(lowerCaseLetters(0), 'abcABC')
    expect(parsed1).toEqual('abc')
    const [, failure2] = parseFailure(lowerCaseLetters(1), 'ABCabc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, parsed3] = parseSuccess(lowerCaseLetters(0, 2), 'abcABC')
    expect(parsed3).toEqual('ab')
    const [, failure4] = parseFailure(lowerCaseLetters(3, 4), 'abABC')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('upperCaseLetter', () => {
    const [, parsed] = parseSuccess(upperCaseLetter, 'AabcB')
    expect(parsed).toEqual('A')
    const [, failure] = parseFailure(upperCaseLetter, 'abc')
    expect(failure).toBeInstanceOf(OneEntityError)
  })

  it('upperCaseLetters', () => {
    const [, parsed] = parseSuccess(upperCaseLetters(), 'ABCabc')
    expect(parsed).toEqual('ABC')
    const [, parsed1] = parseSuccess(upperCaseLetters(0), 'ABCabc')
    expect(parsed1).toEqual('ABC')
    const [, failure2] = parseFailure(upperCaseLetters(1), 'abcABC')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, parsed3] = parseSuccess(upperCaseLetters(0, 2), 'ABCabc')
    expect(parsed3).toEqual('AB')
    const [, failure4] = parseFailure(upperCaseLetters(3, 4), 'ABabc')
    expect(failure4).toBeInstanceOf(ExpectedAtLeast)
  })

  it('digit', () => {
    const [, parsed] = parseSuccess(digit, '123abc')
    expect(parsed).toEqual('1')
    const [, failure] = parseFailure(digit, 'abc')
    expect(failure).toBeInstanceOf(OneEntityError)
  })

  it('digits', () => {
    const [, parsed0] = parseSuccess(digits(), '123abc')
    expect(parsed0).toEqual('123')
    const [, parsed1] = parseSuccess(digits(0), '123abc')
    expect(parsed1).toEqual('123')
    const [, parsed2] = parseSuccess(digits(3, 4), '123abc')
    expect(parsed2).toEqual('123')
    const [, failure] = parseFailure(digits(1), 'abc123')
    expect(failure).toBeInstanceOf(ExpectedAtLeast)
    const [, failure2] = parseFailure(digits(3, 4), '12abc')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
  })

  it('whitespace', () => {
    const [, parsed] = parseSuccess(whitespace, '  abc')
    expect(parsed).toEqual('  ')
    const [, failure] = parseFailure(whitespace, 'abc')
    expect(failure).toBeInstanceOf(ExpectedAtLeast)
  })

  it('optionalWhitespace', () => {
    const [, parsed] = parseSuccess(optionalWhitespace, '  123')
    expect(parsed).toEqual('  ')
    const [, parsed2] = parseSuccess(optionalWhitespace, '123')
    expect(parsed2).toEqual('')
  })

  it('char', () => {
    const [, parsed] = parseSuccess(char, 'abc')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(char, '')
    expect(failure).toBeInstanceOf(OneEntityError)
  })

  it('testChar', () => {
    const [, parsed] = parseSuccess(testChar(v => v === 'a'), 'abc')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(testChar(v => v === 'a'), 'bcd')
    expect(failure).toBeDefined()
    const [, failure3] = parseFailure(testChar(v => v === 'a'), '')
    expect(failure3).toBeDefined()
  })

  it('matchAnyCharOf', () => {
    const [, parsed1] = parseSuccess(matchAnyCharOf('abc'), 'cxy')
    expect(parsed1).toEqual('c')
    const [, failure] = parseFailure(matchAnyCharOf('abc'), 'xyz')
    expect(failure).toBeInstanceOf(AnyCharOfError)
  })

  it('matchNoCharOf', () => {
    const [, parsed1] = parseSuccess(matchNoCharOf('abc'), 'xyz')
    expect(parsed1).toEqual('x')
    const [, failure] = parseFailure(matchNoCharOf('abc'), 'cxy')
    expect(failure).toBeInstanceOf(NoCharOfError)
  })

  it('takeCharWhile', () => {
    const [, parsed1] = parseSuccess(takeCharWhile(v => v.toLowerCase() === v), 'xyZ')
    expect(parsed1).toEqual('xy')
    const [, failure2] = parseFailure(takeCharWhile(v => v.toLowerCase() === v), 'XYZ')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, failure3] = parseFailure(takeCharWhile(v => v.toLowerCase() === v, 2), 'xYZ')
    expect(failure3).toBeDefined()
  })
  
  it('takeCharBetween', () => {
    const [, parsed1] = parseSuccess(takeCharBetween(v => v.toLowerCase() === v, 2, 3), 'xyzabc')
    expect(parsed1).toEqual('xyz')
    const [, failure2] = parseFailure(takeCharBetween(v => v.toLowerCase() === v, 2, 3), 'xYZ')
    expect(failure2).toBeInstanceOf(ExpectedAtLeast)
    const [, failure3] = parseFailure(takeCharBetween(v => v.toLowerCase() === v, 2, 3), '')
    expect(failure3).toBeDefined()
  })
})
