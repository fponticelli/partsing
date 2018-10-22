import { Parser } from '../src/parser'
import { ParseResult, ParseSuccess, ParseFailure } from '../src/parse_result'

const parseSuccess = <R, F>() => new Parser<R, F, R>(source => ParseResult.success<R, F, R>(source, source))
const parseFailure = <R>() => new Parser<R, R, R>(source => ParseResult.failure<R, R, R>(source, source))

describe('parser', () => {
  it('Parser constructor and run', () => {
    const result = parseSuccess().run('a') as ParseSuccess<string, string, string>
    expect(result.value).toEqual('a')
    expect(result.source).toEqual('a')
    
    const f = parseFailure().run('a') as ParseFailure<string, string, string>
    expect(f.failure).toEqual('a')
    expect(f.source).toEqual('a')
  })

  it('Parser.flatMap transform the parsed value', () => {
    const result = parseSuccess()
      .flatMap(v => new Parser(v => ParseResult.success('1', String(v)))).run(1) as ParseSuccess<string, string, number>
    expect(result.value).toEqual('1')
    const f = parseSuccess()
      .flatMap(v => new Parser(v => ParseResult.failure('1', 'x'))).run(1) as ParseFailure<string, string, number>
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
      .flatMapError(e => new Parser(v => ParseResult.success('1', String(v)))).run(1) as ParseSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = parseFailure()
      .flatMapError(e => new Parser(v => ParseResult.failure('1', e))).run(1) as ParseFailure<string, number, string>
    expect(f.failure).toEqual(1)
    const s = parseFailure()
      .flatMapError(e => new Parser(v => ParseResult.success('1', e))).run(1) as ParseSuccess<string, number, string>
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
})