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

import {
  CombineErrors,
  concatOr,
  CustomError,
  Entity,
  ExpectedAnyOf,
  ExpectedAtLeast,
  ExpectedEoi,
  ExpectedMatch,
  ExpectedNoneOf,
  ExpectedOnce,
  ExpectedWithinRange,
  PatternMismatch,
  pluralize,
  UnexpectedEoi
} from '../../src/error'

describe('errors', () => {
  it('entity pluralize', () => {
    expect(pluralize(Entity.CHARACTER, 1)).toEqual('character')
    expect(pluralize(Entity.CHARACTER, 2)).toEqual('characters')
    expect(pluralize(Entity.PREDICATE, 1)).toEqual('predicate')
    expect(pluralize(Entity.PREDICATE, 2)).toEqual('predicates')
    expect(pluralize(Entity.LETTER, 1)).toEqual('letter')
    expect(pluralize(Entity.LETTER, 2)).toEqual('letters')
    expect(pluralize(Entity.UPPERCASE_LETTER, 1)).toEqual('uppercase letter')
    expect(pluralize(Entity.UPPERCASE_LETTER, 2)).toEqual('uppercase letters')
    expect(pluralize(Entity.LOWER_CASE_LETTER, 1)).toEqual('lowercase letter')
    expect(pluralize(Entity.LOWER_CASE_LETTER, 2)).toEqual('lowercase letters')
    expect(pluralize(Entity.DIGIT, 1)).toEqual('digit')
    expect(pluralize(Entity.DIGIT, 2)).toEqual('digits')
    expect(pluralize(Entity.WHITESPACE, 1)).toEqual('whitespace')
    expect(pluralize(Entity.WHITESPACE, 2)).toEqual('whitespaces')
    expect(() => pluralize(1 as never, 2)).toThrow()
  })

  it('error messages', () => {
    expect(new CustomError('abc').toString()).toEqual('abc')
    expect(new ExpectedAnyOf(Entity.CHARACTER, ['a', 'b']).toString()).toEqual('expected any character in a or b')
    expect(new ExpectedAtLeast(1, Entity.CHARACTER).toString()).toEqual('expected at least 1 character')
    expect(new ExpectedEoi().toString()).toEqual('expected end of input')
    expect(new ExpectedMatch('"match"').toString()).toEqual('expected "match"')
    expect(new ExpectedNoneOf(Entity.CHARACTER, ['a', 'b']).toString()).toEqual('expected no character like a or b')
    expect(new ExpectedOnce(Entity.CHARACTER).toString()).toEqual('expected a character')
    expect(new CombineErrors([new CustomError('abc'), new ExpectedEoi()]).toString()).toEqual(`expected one of:
  - abc
  - expected end of input`)
    expect(new ExpectedWithinRange('a', 'b').toString()).toEqual('expected between a and b')
    expect(new PatternMismatch('/a/').toString()).toEqual('expected to match pattern /a/')
    expect(new UnexpectedEoi().toString()).toEqual('unexpected end of input')
  })

  it('concatOr', () => {
    expect(concatOr([])).toEqual('<empty>')
    expect(concatOr(['a'])).toEqual('a')
    expect(concatOr(['a', 'b'])).toEqual('a or b')
    expect(concatOr(['a', 'b', 'c'])).toEqual('a, b or c')
  })
})
