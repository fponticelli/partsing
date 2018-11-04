import {
  concatOr,
  pluralize,
  Entity,
  CustomError,
  ExpectedAnyOf,
  ExpectedAtLeast,
  ExpectedEoi,
  ExpectedMatch,
  ExpectedNoneOf,
  ExpectedOnce,
  ExpectedWithinRange,
  PatternMismatch,
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
    expect(new ExpectedWithinRange('a', 'b').toString()).toEqual('expected between a and b')
    expect(new PatternMismatch('/a/').toString()).toEqual('doesn\'t match pattern /a/')
    expect(new UnexpectedEoi().toString()).toEqual('unexpected end of input')
  })

  it('concatOr', () => {
    expect(concatOr([])).toEqual('<empty>')
    expect(concatOr(['a'])).toEqual('a')
    expect(concatOr(['a', 'b'])).toEqual('a or b')
    expect(concatOr(['a', 'b', 'c'])).toEqual('a, b or c')
  })
})