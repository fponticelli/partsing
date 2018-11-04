import { Entity } from './entity'
import { CustomError } from './custom_error'
import { ExpectedAnyOf } from './expected_any_of'
import { ExpectedAtLeast } from './expected_at_least'
import { ExpectedEoi } from './expected_eoi'
import { ExpectedField } from './expected_field'
import { ExpectedMatch } from './expected_match'
import { ExpectedNoneOf } from './expected_none_of'
import { ExpectedOnce } from './expected_once'
import { CombineErrors } from './combine_errors'
import { ExpectedWithinRange } from './expected_within_range'
import { PatternMismatch } from './pattern_mismatch'
import { UnexpectedEoi } from './unexpected_eoi'

export type DecodeError
  = CustomError
  | ExpectedAnyOf
  | ExpectedAtLeast
  | ExpectedEoi
  | ExpectedField
  | ExpectedMatch
  | ExpectedNoneOf
  | ExpectedOnce
  | CombineErrors
  | ExpectedWithinRange
  | PatternMismatch
  | UnexpectedEoi

export const DecodeError = {
  custom: (value: string) => new CustomError(value) as DecodeError,
  expectedAnyOf: (entity: Entity, values: string[]) => new ExpectedAnyOf(entity, values) as DecodeError,
  expectedAtLeast: (min: number, entity: Entity) => new ExpectedAtLeast(min, entity) as DecodeError,
  expectedEot: new ExpectedEoi() as DecodeError,
  expectedField: (field: string) => new ExpectedField(field) as DecodeError,
  expectedMatch: (value: string) => new ExpectedMatch(value) as DecodeError,
  expectedNoneOf: (entity: Entity, values: string[]) => new ExpectedNoneOf(entity, values) as DecodeError,
  expectedOnce: (entity: Entity) => new ExpectedOnce(entity) as DecodeError,
  combine: (errors: DecodeError[]) => new CombineErrors(errors) as DecodeError,
  expectedWithinRange: (min: string, max: string) => new ExpectedWithinRange(min, max) as DecodeError,
  patternMismatch: (pattern: string) => new PatternMismatch(pattern) as DecodeError,
  unexpectedEoi: new UnexpectedEoi() as DecodeError
}

export { Entity, pluralize } from './entity'
export { CustomError } from './custom_error'
export { ExpectedAnyOf, concatOr } from './expected_any_of'
export { ExpectedAtLeast } from './expected_at_least'
export { ExpectedEoi } from './expected_eoi'
export { ExpectedField } from './expected_field'
export { ExpectedMatch } from './expected_match'
export { ExpectedNoneOf } from './expected_none_of'
export { ExpectedOnce } from './expected_once'
export { CombineErrors } from './combine_errors'
export { ExpectedWithinRange } from './expected_within_range'
export { PatternMismatch } from './pattern_mismatch'
export { UnexpectedEoi } from './unexpected_eoi'
