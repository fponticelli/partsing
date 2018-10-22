import {
  eot,
  expect as expected,
  regexp,
  parse,
  rest,
  TextParser,
  TextSource,
  TextFailure,
  index
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
})