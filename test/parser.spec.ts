import { Parser, succeed, fail, lazy, sequence, oneOf } from '../src/parser'
import { ParseResult, ParseSuccess, ParseFailure } from '../src/parse_result'
import { parseText, digit, regexp, TextInput, match, letter } from '../src/text_parser'

const parseSuccess = <R, F>() => Parser.of<R, F, R>(input => ParseResult.success<R, F, R>(input, input))
const parseFailure = <R>() => Parser.of<R, R, R>(input => ParseResult.failure<R, R, R>(input, input))

const runSuccess = <R, F, S>(p: Parser<R, F, S>, s: S) => {
  const r = p.run(s)
  if (r.isFailure())
    fail(`parser ${p} was supposed to succeed parsing '${s}'`)
  return [r.input, (r as ParseSuccess<R, F, S>).value]
}

const runFailure = <R, F, S>(p: Parser<R, F, S>, s: S) => {
  const r = p.run(s)
  if (r.isSuccess())
    fail(`parser ${p} was supposed to fail parsing '${s}'`)
  return [r.input, (r as ParseFailure<R, F, S>).failure]
}

describe('parser', () => {
  it('Parser constructor and run', () => {
    const [input, value] = runSuccess(parseSuccess(), 'a')
    expect(value).toEqual('a')
    expect(input).toEqual('a')
    
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
    const result = parseSuccess().withResult(2).run(1) as ParseSuccess<number, string, string>
    expect(result.value).toEqual(2)
  })

  it('Parser.join', () => {
    const parser = regexp(/^1/).join(regexp(/^a/)).join(regexp(/^b/))
    const result = parseText(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual([['1', 'a'], 'b'])
    const result2 = parseText(parser, '1ba').getUnsafeFailure()
    expect(result2).toBeDefined()
  })

  it('sequence', () => {
    const parser = sequence<[string, string, string], string, TextInput>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = parseText(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
    const result2 = parseText(parser, '1ba').getUnsafeFailure()
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

  it('repeatX', () => {
    const p = digit.repeatBetween(2, 3)
    expect(parseText(p, '1abc').getUnsafeFailure()).toBeDefined()
    expect(parseText(p, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parseText(p, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    expect(parseText(p, '1234abc').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const t = digit.repeat(2)
    expect(parseText(t, '1abc').getUnsafeFailure()).toBeDefined()
    expect(parseText(t, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parseText(t, '123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const a = digit.repeatAtMost(2)
    expect(parseText(a, 'abc').getUnsafeSuccess()).toEqual([])
    expect(parseText(a, '1b').getUnsafeSuccess()).toEqual(['1'])
    expect(parseText(a, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parseText(a, '123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const m = digit.repeatAtLeast()
    expect(parseText(m, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parseText(m, '1b').getUnsafeSuccess()).toEqual(['1'])
    expect(parseText(m, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parseText(m, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const m2 = digit.repeatAtLeast(2)
    expect(parseText(m2, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parseText(m2, '1b').getUnsafeFailure()).toBeDefined()
    expect(parseText(m2, '12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(parseText(m2, '123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
  })

  it('or', () => {
    const p = digit.or(match('a'))
    expect(parseText(p, '1').getUnsafeSuccess()).toEqual('1')
    expect(parseText(p, 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseText(p, 'x').getUnsafeFailure()).toBeDefined()
  })

  it('oneOf', () => {
    const p = oneOf<[string, string], string, TextInput>(digit, match('a'))
    expect(parseText(p, '1').getUnsafeSuccess()).toEqual('1')
    expect(parseText(p, 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseText(p, 'x').getUnsafeFailure()).toBeDefined()
    expect(() => parseText(oneOf(), 'x')).toThrow(Error)
  })

  it('sequence', () => {
    const parser = sequence<[string, string, string], string, TextInput>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = parseText(parser, '1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
  })

  it('probe', () => {
    let value = undefined
    const p = digit.probe(v => value = v)
    const result = parseText(p, '1')
    expect(result).toBe(value)
  })

  it('separatedBy', () => {
    const p = letter.separatedBy(match(','))
    expect(parseText(p, '1').getUnsafeSuccess()).toEqual([])
    expect(parseText(p, 'a').getUnsafeSuccess()).toEqual(['a'])
    expect(parseText(p, 'a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(parseText(p, 'a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])    
  })

  it('separatedByAtLeastOnce', () => {
    const p = letter.separatedByAtLeastOnce(match(','))
    expect(parseText(p, 'a').getUnsafeFailure()).toBeDefined()
    expect(parseText(p, 'a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(parseText(p, 'a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
  })

  it('ofGuaranteed', () => {
    const p = Parser.ofGuaranteed<string, string, TextInput>((input: {input: string, index: number}) => [input, input.input])
    const result = parseText(p, '1').getUnsafeSuccess()
    expect(result).toBe('1')
  })
})
