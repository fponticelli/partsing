import {
  char,
  digit,
  digits,
  eot,
  index,
  letter,
  letters,
  match,
  matchNoneOf,
  matchOneOf,
  optionalWhitespace,
  parse,
  regexp,
  rest,
  takeBetween,
  takeWhile,
  testChar,
  TextParser,
  TextSource,
  whitespace
} from '../src/text_parser'

const parseSuccess = <R>(parser: TextParser<R>, source: string): [TextSource, R] => {
  const r = parse(parser, source)
  if (r.isFailure()) {
    throw 'expected parse success'
  } else {
    return [r.source, r.value]
  }
}

const parseFailure = <R>(parser: TextParser<R>, source: string): [TextSource, string] => {
  const r = parse(parser, source)
  if (r.isSuccess()) {
    throw 'expected parse failure'
  } else {
    return [r.source, r.failure]
  }
}

describe('parse_text', () => {
  it('regexp', () => {
    const p = regexp(/\d+/g)
    expect(parse(p, 'abc').isFailure()).toEqual(true)
    const [source, parsed] = parseSuccess(p, 'a123b')
    expect(source.index).toEqual(4)
    expect(parsed).toEqual('123')
  })

  it('regexp with group', () => {
    const p = regexp(/a(\d+)b/g, 1)
    const [source, parsed] = parseSuccess(p, '--a123b--')
    expect(source.index).toEqual(7)
    expect(parsed).toEqual('123')
  })

  it('regexp matching from start', () => {
    const p = regexp(/^\d+/g)
    const [source, failure] = parseFailure(p, 'a123b')
    expect(source.index).toEqual(0)
    expect(failure).toEqual('/^\\d+/g')
    const [source2, parsed] = parseSuccess(p, '123')
    expect(source2.index).toEqual(3)
    expect(parsed).toEqual('123')
  })

  it('regexp matching from start without global', () => {
    const p = regexp(/^\d+/)
    const [source, failure] = parseFailure(p, 'a123b')
    expect(source.index).toEqual(0)
    expect(failure).toEqual('/^\\d+/')
    const [source2, parsed] = parseSuccess(p, '123')
    expect(source2.index).toEqual(3)
    expect(parsed).toEqual('123')
  })

  it('expected changes message', () => {
    const p = regexp(/^\d+/g).withFailure('number')
    const [source, failure] = parseFailure(p, 'a123b')
    expect(failure).toEqual('number')
  })

  it('index', () => {
    const p = regexp(/\d+/g)
    const [, parsed] = parseSuccess(p.pickNext(index()), 'a123b')
    expect(parsed).toEqual(4)
  })

  it('rest', () => {
    const p = regexp(/\d+/g)
    const [, parsed] = parseSuccess(p.pickNext(rest()), 'a123b')
    expect(parsed).toEqual('b')
  })

  it('eot', () => {
    const [, parsed] = parseSuccess(rest().skipNext(eot()), 'a123b')
    expect(parsed).toEqual('a123b')
    const [, failure] = parseFailure(eot(), 'a123b')
    expect(failure).toEqual('EOT')
  })

  it('match', () => {
    const [, parsed] = parseSuccess(match('a12'), 'a123b')
    expect(parsed).toEqual('a12')
    const [, failure] = parseFailure(match('abc'), 'a123b')
    expect(failure).toEqual('"abc"')
  })

  it('letter', () => {
    const [, parsed] = parseSuccess(letter(), 'a123b')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(letter(), '123')
    expect(failure).toEqual('one letter')
  })

  it('letters', () => {
    const [, parsed] = parseSuccess(letters(), 'abc123')
    expect(parsed).toEqual('abc')
    const [, parsed1] = parseSuccess(letters(0), 'abc123')
    expect(parsed1).toEqual('abc')
    const [, failure2] = parseFailure(letters(1), '123abc')
    expect(failure2).toEqual('at least 1 letter(s)')
    const [, parsed3] = parseSuccess(letters(0, 2), 'abc123')
    expect(parsed3).toEqual('ab')
    const [, failure4] = parseFailure(letters(3, 4), 'ab123')
    expect(failure4).toEqual('between 3 and 4 letter(s)')
  })

  it('digit', () => {
    const [, parsed] = parseSuccess(digit(), '123abc')
    expect(parsed).toEqual('1')
    const [, failure] = parseFailure(digit(), 'abc')
    expect(failure).toEqual('one digit')
  })

  it('digits', () => {
    const [, parsed0] = parseSuccess(digits(), '123abc')
    expect(parsed0).toEqual('123')
    const [, parsed1] = parseSuccess(digits(0), '123abc')
    expect(parsed1).toEqual('123')
    const [, parsed2] = parseSuccess(digits(3, 4), '123abc')
    expect(parsed2).toEqual('123')
    const [, failure] = parseFailure(digits(1), 'abc123')
    expect(failure).toEqual('at least 1 digit(s)')
    const [, failure2] = parseFailure(digits(3, 4), '12abc')
    expect(failure2).toEqual('between 3 and 4 digit(s)')
  })

  it('whitespace', () => {
    const [, parsed] = parseSuccess(whitespace(), '  abc')
    expect(parsed).toEqual('  ')
    const [, failure] = parseFailure(whitespace(), 'abc')
    expect(failure).toEqual('whitespace')
  })

  it('optionalWhitespace', () => {
    const [, parsed] = parseSuccess(optionalWhitespace(), '  123')
    expect(parsed).toEqual('  ')
    const [, parsed2] = parseSuccess(optionalWhitespace(), '123')
    expect(parsed2).toEqual('')
  })

  it('char', () => {
    const [, parsed] = parseSuccess(char(), 'abc')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(char(), '')
    expect(failure).toEqual('a character')
  })

  it('testChar', () => {
    const [, parsed] = parseSuccess(testChar(v => v === 'a'), 'abc')
    expect(parsed).toEqual('a')
    const [, failure] = parseFailure(testChar(v => v === 'a'), 'bcd')
    expect(failure).toBeDefined()
    const [, failure3] = parseFailure(testChar(v => v === 'a'), '')
    expect(failure3).toBeDefined()
  })

  it('matchOneOf', () => {
    const [, parsed1] = parseSuccess(matchOneOf('abc'), 'cxy')
    expect(parsed1).toEqual('c')
    const [, failure] = parseFailure(matchOneOf('abc'), 'xyz')
    expect(failure).toEqual('expected one of `abc`')
  })

  it('matchNoneOf', () => {
    const [, parsed1] = parseSuccess(matchNoneOf('abc'), 'xyz')
    expect(parsed1).toEqual('x')
    const [, failure] = parseFailure(matchNoneOf('abc'), 'cxy')
    expect(failure).toEqual('expected none of `abc`')
  })

  it('takeWhile', () => {
    const [, parsed1] = parseSuccess(takeWhile(v => v.toLowerCase() === v), 'xyZ')
    expect(parsed1).toEqual('xy')
    const [, failure2] = parseFailure(takeWhile(v => v.toLowerCase() === v), 'XYZ')
    expect(failure2).toEqual('expected at least 1 occurrance(s) of predicate')
    const [, failure3] = parseFailure(takeWhile(v => v.toLowerCase() === v, 2), 'xYZ')
    expect(failure3).toBeDefined()
  })
  
  it('takeBetween', () => {
    const [, parsed1] = parseSuccess(takeBetween(v => v.toLowerCase() === v, 2, 3), 'xyzabc')
    expect(parsed1).toEqual('xyz')
    const [, failure2] = parseFailure(takeBetween(v => v.toLowerCase() === v, 2, 3), 'xYZ')
    expect(failure2).toEqual('expected at least 2 occurrance(s) of predicate')
    const [, failure3] = parseFailure(takeBetween(v => v.toLowerCase() === v, 2, 3), '')
    expect(failure3).toBeDefined()
  })
})

/*
export const takeWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
export const takeBetween = (f: (c: string) => boolean, min: number, max: number): TextParser<string> =>
*/  