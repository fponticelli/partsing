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

import { autoQuote, pathToString, valueToString, concatOr } from '../../src/utils'

describe('util', () => {
  it('pathToString', () => {
    expect(pathToString(['a', 'a b c', 'd', 1, '$f'])).toEqual('a["a b c"].d[1].$f')
  })

  it('autoQuote', () => {
    expect(autoQuote('abc')).toEqual('abc')
    expect(autoQuote('a"bc')).toEqual('"a\\"bc"')
    expect(autoQuote('a-b')).toEqual('"a-b"')
  })

  it('valueToString', () => {
    expect(valueToString(new A('hello'))).toEqual('A {a:hello}')
    expect(valueToString({ a: 'hello' })).toEqual('{a:hello}')
  })

  it('concatOr', () => {
    expect(concatOr([])).toEqual('<empty>')
    expect(concatOr(['a'])).toEqual('a')
    expect(concatOr(['a', 'b'])).toEqual('a or b')
    expect(concatOr(['a', 'b', 'c'])).toEqual('a, b or c')
  })
})

class A {
  constructor(readonly a: string) {}
}
