import { Parser } from '../src/parser'
import { ParseResult, ParseSuccess, ParseFailure } from '../src/parse_result'
import { regexp, parse } from '../src/text_parser';

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
    expect(parse(parser, '1ab')).toBe(1)
    const result = parse(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual([1, 'a', 'b'])
  })
})