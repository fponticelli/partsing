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
  entityToString,
  UnexpectedEoi
} from '../../src/error'

describe('errors', () => {
  it('entity pluralize', () => {
    expect(entityToString(Entity.CHARACTER, 1)).toEqual('character')
    expect(entityToString(Entity.CHARACTER, 2)).toEqual('characters')
    expect(entityToString(Entity.CHARACTER_CODE, 1)).toEqual('character code')
    expect(entityToString(Entity.CHARACTER_CODE, 2)).toEqual('character codes')
    expect(entityToString(Entity.DIGIT, 1)).toEqual('digit')
    expect(entityToString(Entity.DIGIT, 2)).toEqual('digits')
    expect(entityToString(Entity.LETTER, 1)).toEqual('letter')
    expect(entityToString(Entity.LETTER, 2)).toEqual('letters')
    expect(entityToString(Entity.LITERAL, 1)).toEqual('literal')
    expect(entityToString(Entity.LITERAL, 2)).toEqual('literals')
    expect(entityToString(Entity.LOWER_CASE_LETTER, 1)).toEqual('lowercase letter')
    expect(entityToString(Entity.LOWER_CASE_LETTER, 2)).toEqual('lowercase letters')
    expect(entityToString(Entity.PREDICATE, 1)).toEqual('predicate')
    expect(entityToString(Entity.PREDICATE, 2)).toEqual('predicates')
    expect(entityToString(Entity.STRING, 1)).toEqual('string')
    expect(entityToString(Entity.STRING, 2)).toEqual('strings')
    expect(entityToString(Entity.STRING_INSENSITIVE, 1)).toEqual('string insensitive')
    expect(entityToString(Entity.STRING_INSENSITIVE, 2)).toEqual('strings insensitive')
    expect(entityToString(Entity.TYPE, 1)).toEqual('type')
    expect(entityToString(Entity.TYPE, 2)).toEqual('types')
    expect(entityToString(Entity.UPPERCASE_LETTER, 1)).toEqual('uppercase letter')
    expect(entityToString(Entity.UPPERCASE_LETTER, 2)).toEqual('uppercase letters')
    expect(entityToString(Entity.WHITESPACE, 1)).toEqual('whitespace')
    expect(entityToString(Entity.WHITESPACE, 2)).toEqual('whitespaces')
    expect(() => entityToString(true as never, 1)).toThrow()
    expect(() => entityToString(true as never, 2)).toThrow()
  })

  it('error messages', () => {
    expect(new CustomError('abc').toString()).toEqual('abc')
    expect(new ExpectedAnyOf(Entity.CHARACTER, ['a', 'b']).toString()).toEqual('any character in a or b')
    expect(new ExpectedAtLeast(1, Entity.CHARACTER).toString()).toEqual('at least 1 character')
    expect(new ExpectedEoi().toString()).toEqual('end of input')
    expect(new ExpectedMatch(Entity.STRING, '"match"').toString()).toEqual('"match" (string)')
    expect(new ExpectedNoneOf(Entity.CHARACTER, ['a', 'b']).toString()).toEqual('no character like a or b')
    expect(new ExpectedOnce(Entity.CHARACTER).toString()).toEqual('a character')
    expect(new ExpectedWithinRange('a', 'b').toString()).toEqual('between a and b')
    expect(new PatternMismatch('/a/').toString()).toEqual('to match pattern /a/')
    expect(new UnexpectedEoi().toString()).toEqual('NOT end of input')
  })
})
