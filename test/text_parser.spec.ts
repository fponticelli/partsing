import {
  eot,
  expect as expected,
  letters,
  digit,
  digits,
  regexp,
  parse,
  rest,
  TextParser,
  TextSource,
  TextFailure,
  index,
  match,
  letter
} from '../src/text_parser'

const parseSuccess = <R>(parser: TextParser<R>, source: string): [TextSource, R] => {
  const r = parse(parser, source)
  if (r.isFailure()) {
    throw 'expected parse success'
  } else {
    return [r.source, r.value]
  }
}

const parseFailure = <R>(parser: TextParser<R>, source: string): [TextSource, TextFailure] => {
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
    expect(failure.expected).toEqual('/^\\d+/g')
    const [source2, parsed] = parseSuccess(p, '123')
    expect(source2.index).toEqual(3)
    expect(parsed).toEqual('123')
  })

  it('expected changes message', () => {
    const p = expected('number', regexp(/^\d+/g))
    const [source, failure] = parseFailure(p, 'a123b')
    expect(failure.expected).toEqual('number')
  })

  it('index', () => {
    const p = regexp(/\d+/g)
    const [_, parsed] = parseSuccess(p.then(index()), 'a123b')
    expect(parsed).toEqual(4)
  })

  it('rest', () => {
    const p = regexp(/\d+/g)
    const [_, parsed] = parseSuccess(p.then(rest()), 'a123b')
    expect(parsed).toEqual('b')
  })

  it('eot', () => {
    const [_, parsed] = parseSuccess(rest().skip(eot()), 'a123b')
    expect(parsed).toEqual('a123b')
    const [_2, failure] = parseFailure(eot(), 'a123b')
    expect(failure.expected).toEqual('EOT')
  })

  it('match', () => {
    const [_, parsed] = parseSuccess(match('a12'), 'a123b')
    expect(parsed).toEqual('a12')
    const [_2, failure] = parseFailure(match('abc'), 'a123b')
    expect(failure.expected).toEqual('"abc"')
  })

  it('letter', () => {
    const [_, parsed] = parseSuccess(letter(), 'a123b')
    expect(parsed).toEqual('a')
    const [_2, failure] = parseFailure(letter(), '123')
    expect(failure.expected).toEqual('one letter')
  })

  it('letters', () => {
    const [_, parsed] = parseSuccess(letters(0), 'abc123')
    expect(parsed).toEqual('abc')
    const [_2, failure] = parseFailure(letters(1), '123abc')
    expect(failure.expected).toEqual('at least 1 letter(s)')
  })

  it('digit', () => {
    const [_, parsed] = parseSuccess(digit(), '123abc')
    expect(parsed).toEqual('1')
    const [_2, failure] = parseFailure(digit(), 'abc')
    expect(failure.expected).toEqual('one digit')
  })

  it('digits', () => {
    const [_, parsed] = parseSuccess(digits(0), '123abc')
    expect(parsed).toEqual('123')
    const [_2, failure] = parseFailure(digits(1), 'abc123')
    expect(failure.expected).toEqual('at least 1 digit(s)')
  })
})