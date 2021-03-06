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

import { DecodeFailure, DecodeSuccess, success, failure } from '../../src/core/result'

describe('decode_result', () => {
  it('success returns a validate DecodeSuccess', () => {
    const result = success('some', 1)
    expect(result.isSuccess()).toEqual(true)
    expect(result.isFailure()).toEqual(false)
    expect(result.input).toEqual('some')
    expect(result.kind).toEqual('decode-success')
    if (result.isSuccess()) expect(result.value).toEqual(1)
    expect(result.toString()).toEqual('DecodeSuccess<1>: "some"')
  })

  it('failure returns a validate DecodeFailure', () => {
    const result = failure('some', { error: 'error' })
    expect(result.isSuccess()).toEqual(false)
    expect(result.isFailure()).toEqual(true)
    expect(result.input).toEqual('some')
    expect(result.kind).toEqual('decode-failure')
    if (result.isFailure()) expect(result.failures).toEqual([{ error: 'error' }])
    expect(result.toString()).toEqual('DecodeFailure<[{"error":"error"}]>: "some"')
  })

  it('match will return a value for each constructor', () => {
    expect(
      success('', 1).match({
        success: s => String(s.value),
        failure: _ => 'nah'
      })
    ).toEqual('1')
    expect(
      failure('', 1).match({
        failure: f => String(f.failures),
        success: _ => 'nah'
      })
    ).toEqual('1')
  })

  it('map will transform success but not failure', () => {
    const v = success('', 1).map(String) as DecodeSuccess<string, any, any>
    expect(v.value).toEqual('1')
    const f = failure('', 1).map(String) as DecodeFailure<any, any, number>
    expect(f.failures).toEqual([1])
  })

  it('flatMap will transform success but not failure', () => {
    const v = success('', 1).flatMap(v => success('', String(v))) as DecodeSuccess<string, any, any>
    expect(v.value).toEqual('1')
    const s = success('', 1).flatMap(v => failure('', 'fail')) as DecodeFailure<string, any, any>
    expect(s.failures).toEqual(['fail'])
    const f = failure('', 1).flatMap(v => success('', String(v))) as DecodeFailure<any, any, number>
    expect(f.failures).toEqual([1])
  })

  it('mapError will transform failure but not success', () => {
    const v = success('', 1).mapError(String) as DecodeSuccess<any, number, any>
    expect(v.value).toEqual(1)
    const f = failure('', 1).mapError(String) as DecodeFailure<any, string, any>
    expect(f.failures).toEqual(['1'])
  })

  it('flatMapError will transform failure but not success', () => {
    const v = success('', 1).flatMapError(e => success('', 2)) as DecodeSuccess<string, number, string>
    expect(v.value).toEqual(1)
    const s = failure('', 1).flatMapError(e => failure('', `${e} fail`)) as DecodeFailure<string, any, any>
    expect(s.failures).toEqual(['1 fail'])
    const f = failure('', 1).flatMapError(v => success('', 1)) as DecodeSuccess<any, number, any>
    expect(f.value).toEqual(1)
  })

  it('getUnsafeSuccess/getUnsafeFailure throw when not safe', () => {
    const s = success('', 1)
    expect(s.getUnsafeFailures).toThrow(Error)
    const f = failure('', 1)
    expect(f.getUnsafeSuccess).toThrow(Error)
  })
})
