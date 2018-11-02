import { ParseResult, ParseSuccess, ParseFailure } from '../src/parse_result'

describe('parse_result', () => {
  it('ParseResult.success returns a validate ParseSuccess', () => {
    const result = ParseResult.success('some', 1)
    expect(result.isSuccess()).toEqual(true)
    expect(result.isFailure()).toEqual(false)
    expect(result.input).toEqual('some')
    expect(result.kind).toEqual('parse-success')
    if (result.isSuccess())
      expect(result.value).toEqual(1)
    expect(result.toString()).toEqual('ParseSuccess<1>: "some"')
  })

  it('ParseResult.failure returns a validate ParseFailure', () => {
    const result = ParseResult.failure('some', { error: 'error' })
    expect(result.isSuccess()).toEqual(false)
    expect(result.isFailure()).toEqual(true)
    expect(result.input).toEqual('some')
    expect(result.kind).toEqual('parse-failure')
    if (result.isFailure())
      expect(result.failure).toEqual({ error: 'error' })
    expect(result.toString()).toEqual('ParseFailure<{"error":"error"}>: "some"')
  })

  it('match will return a value for each constructor', () => {
    expect(
      ParseResult.success('', 1).match({
        success: (s) => String(s.value),
        failure: (_) => 'nah'
      })
    ).toEqual('1')
    expect(
      ParseResult.failure('', 1).match({
        failure: (f) => String(f.failure),
        success: (_) => 'nah'
      })
    ).toEqual('1')
  })

  it('map will transform success but not failure', () => {
    const v = ParseResult.success('', 1).map(String) as ParseSuccess<string, any, any>
    expect(v.value).toEqual('1')
    const f = ParseResult.failure('', 1).map(String) as ParseFailure<any, any, number>
    expect(f.failure).toEqual(1)
  })

  it('flatMap will transform success but not failure', () => {
    const v = ParseResult.success('', 1).flatMap(v => ParseResult.success('', String(v))) as ParseSuccess<string, any, any>
    expect(v.value).toEqual('1')
    const s = ParseResult.success('', 1).flatMap(v => ParseResult.failure('', 'fail')) as ParseFailure<string, any, any>
    expect(s.failure).toEqual('fail')
    const f = ParseResult.failure('', 1).flatMap(v => ParseResult.success('', String(v))) as ParseFailure<any, any, number>
    expect(f.failure).toEqual(1)
  })

  it('mapError will transform failure but not success', () => {
    const v = ParseResult.success('', 1).mapError(String) as ParseSuccess<any, number, any>
    expect(v.value).toEqual(1)
    const f = ParseResult.failure('', 1).mapError(String) as ParseFailure<any, string, any>
    expect(f.failure).toEqual('1')
  })

  it('flatMapError will transform failure but not success', () => {
    const v = ParseResult.success('', 1).flatMapError(e => ParseResult.success('', 2)) as ParseSuccess<string, number, string>
    expect(v.value).toEqual(1)
    const s = ParseResult.failure('', 1).flatMapError(e => ParseResult.failure('', `${e} fail`)) as ParseFailure<string, any, any>
    expect(s.failure).toEqual('1 fail')
    const f = ParseResult.failure('', 1).flatMapError(v => ParseResult.success('', 1)) as ParseSuccess<any, number, any>
    expect(f.value).toEqual(1)
  })

  it('getUnsafeSuccess/getUnsafeFailure throw when not safe', () => {
    const s = new ParseSuccess('', 1)
    expect(s.getUnsafeFailure).toThrow(Error)
    const f = new ParseFailure('', 1)
    expect(f.getUnsafeSuccess).toThrow(Error)
  })
})
