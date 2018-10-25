import { Parser, succeed, fail, lazy, between, times, atMost, many, seq, alt } from '../src/parser'
import { ParseResult, ParseSuccess, ParseFailure } from '../src/parse_result'
import { parse, digit, regexp, TextFailure, TextSource, match, letter } from '../src/text_parser'

const parseSuccess = <R, F>() => Parser.of<R, F, R>(source => ParseResult.success<R, F, R>(source, source))
const parseFailure = <R>() => Parser.of<R, R, R>(source => ParseResult.failure<R, R, R>(source, source))

const runSuccess = <R, F, S>(p: Parser<R, F, S>, s: S) => {
  const r = p.run(s)
  if (r.isFailure())
    fail(`parser ${p} was supposed to succeed parsing '${s}'`)
  return [r.source, (r as ParseSuccess<R, F, S>).value]
}

const runFailure = <R, F, S>(p: Parser<R, F, S>, s: S) => {
  const r = p.run(s)
  if (r.isSuccess())
    fail(`parser ${p} was supposed to fail parsing '${s}'`)
  return [r.source, (r as ParseFailure<R, F, S>).failure]
}

describe('parser', () => {
  it('Parser constructor and run', () => {
    const [source, value] = runSuccess(parseSuccess(), 'a')
    expect(value).toEqual('a')
    expect(source).toEqual('a')
    
    const [source2, failure] = runFailure(parseFailure(), 'b')
    expect(failure).toEqual('b')
    expect(source2).toEqual('b')
  })

  it('Parser.flatMap transform the parsed value', () => {
    const result = parseSuccess()
      .flatMap(x => Parser.of(v => ParseResult.success('1', `${x}${v}`))).run(2) as ParseSuccess<string, string, number>
    expect(result.value).toEqual('22')
    const f = parseSuccess()
      .flatMap(x => Parser.of(v => ParseResult.failure('1', 'x'))).run(1) as ParseFailure<string, string, number>
    expect(f.failure).toEqual('x')
  })

  it('Parser.map transform the parsed value', () => {
    const result = parseSuccess().map(String).run(1) as ParseSuccess<string, string, number>
    expect(result.value).toEqual('1')
    const f = parseFailure().map(String).run(1) as ParseFailure<string, number, number>
    expect(f.failure).toEqual(1)
  })

  it('Parser.flatMapError transform the failure value', () => {
    const result = parseSuccess()
      .flatMapError(e => Parser.of(v => ParseResult.success('1', String(v)))).run(1) as ParseSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = parseFailure()
      .flatMapError(e => Parser.of(v => ParseResult.failure('1', e))).run(1) as ParseFailure<string, number, string>
    expect(f.failure).toEqual(1)
    const s = parseFailure()
      .flatMapError(e => Parser.of(v => ParseResult.success('1', e))).run(1) as ParseSuccess<string, number, string>
    expect(s.value).toEqual(1)
  })

  it('Parser.mapError transform the failure value', () => {
    const result = parseSuccess().mapError(String).run(1) as ParseSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = parseFailure().mapError(String).run(1) as ParseFailure<string, string, number>
    expect(f.failure).toEqual('1')
  })

  it('Parser.result returns the passed value', () => {
    const result = parseSuccess().result(2).run(1) as ParseSuccess<number, string, string>
    expect(result.value).toEqual(2)
  })

  it('Parser.join', () => {
    const parser = regexp(/^1/).join(regexp(/^a/), regexp(/^b/))
    const result = parse(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
    const result2 = parse(parser, '1ba').getUnsafeFailure()
    expect(result2).toBeDefined()
  })

  it('seq', () => {
    const parser = seq<[string, string, string], TextFailure, TextSource>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = parse(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
    const result2 = parse(parser, '1ba').getUnsafeFailure()
    expect(result2).toBeDefined()
  })

  it('succeed', () => {
    expect(
      succeed('s').run('any').getUnsafeSuccess()
    ).toEqual('s')
  })

  it('fail', () => {
    expect(
      fail('s').run('any').getUnsafeFailure()
    ).toEqual('s')
  })

  it('lazy', () => {
    const p = lazy(() => succeed('s'))
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
  })

  it('between', () => {
    const p = between(digit(), 2, 3)
    expect(parse(p, '1abc').getUnsafeFailure()).toBeDefined()
    expect(parse(p, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parse(p, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    expect(parse(p, '1234abc').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const t = times(digit(), 2)
    expect(parse(t, '1abc').getUnsafeFailure()).toBeDefined()
    expect(parse(t, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parse(t, '123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const a = atMost(digit(), 2)
    expect(parse(a, 'abc').getUnsafeSuccess()).toEqual([])
    expect(parse(a, '1b').getUnsafeSuccess()).toEqual(['1'])
    expect(parse(a, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parse(a, '123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const m = many(digit())
    expect(parse(m, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parse(m, '1b').getUnsafeSuccess()).toEqual(['1'])
    expect(parse(m, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parse(m, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const m2 = many(digit(), 2)
    expect(parse(m2, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parse(m2, '1b').getUnsafeFailure()).toBeDefined()
    expect(parse(m2, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parse(m2, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const m3 = digit().many()
    expect(parse(m3, 'abc').getUnsafeFailure()).toBeDefined()
  })

  it('or', () => {
    const p = digit().or(match('a'))
    expect(parse(p, '1').getUnsafeSuccess()).toEqual('1')
    expect(parse(p, 'a').getUnsafeSuccess()).toEqual('a')
    expect(parse(p, 'x').getUnsafeFailure()).toBeDefined()
  })

  it('alt', () => {
    const p = alt<[string, string], TextFailure, TextSource>(digit(), match('a'))
    expect(parse(p, '1').getUnsafeSuccess()).toEqual('1')
    expect(parse(p, 'a').getUnsafeSuccess()).toEqual('a')
    expect(parse(p, 'x').getUnsafeFailure()).toBeDefined()
    expect(() => parse(alt(), 'x')).toThrow(Error)
  })

  it('seq', () => {
    const parser = seq<[string, string, string], TextFailure, TextSource>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = parse(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
  })

  it('probe', () => {
    let value = undefined
    const p = digit().probe(v => value = v)
    const result = parse(p, '1')
    expect(result).toBe(value)
  })

  it('separatedBy', () => {
    const p = letter().separatedBy(match(','))
    expect(parse(p, '1').getUnsafeSuccess()).toEqual([])
    expect(parse(p, 'a').getUnsafeSuccess()).toEqual(['a'])
    expect(parse(p, 'a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(parse(p, 'a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])    
  })

  it('separatedByAtLeastOnce', () => {
    const p = letter().separatedByAtLeastOnce(match(','))
    expect(parse(p, 'a').getUnsafeFailure()).toBeDefined()
    expect(parse(p, 'a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(parse(p, 'a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
  })

  it('ofGuaranteed', () => {
    const p = Parser.ofGuaranteed<string, TextFailure, TextSource>((source: {source: string, index: number}) => [source, source.source])
    const result = parse(p, '1').getUnsafeSuccess()
    expect(result).toBe('1')
  })
})
