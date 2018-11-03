import { Entity } from './entity';
import { CustomError } from './custom_error';
import { ExpectedAnyOf } from './expected_any_of';
import { ExpectedAtLeast } from './expected_at_least';
import { ExpectedEoi } from './expected_eoi';
import { ExpectedField } from './expected_field';
import { ExpectedMatch } from './expected_match';
import { ExpectedNoneOf } from './expected_none_of';
import { ExpectedOnce } from './expected_once';
import { PatternMismatch } from './pattern_mismatch';
import { UnexpectedEoi } from './unexpected_eoi';
export declare type DecodeError = CustomError | ExpectedAnyOf | ExpectedAtLeast | ExpectedEoi | ExpectedField | ExpectedMatch | ExpectedNoneOf | ExpectedOnce | PatternMismatch | UnexpectedEoi;
export declare const DecodeError: {
    custom: (value: string) => DecodeError;
    expectedAnyOf: (entity: Entity, values: string[]) => DecodeError;
    expectedAtLeast: (min: number, entity: Entity) => DecodeError;
    expectedEot: DecodeError;
    expectedField: (field: string) => DecodeError;
    expectedMatch: (value: string) => DecodeError;
    expectedNoneOf: (entity: Entity, values: string[]) => DecodeError;
    expectedOnce: (entity: Entity) => DecodeError;
    patternMismatch: (pattern: string) => DecodeError;
    unexpectedEoi: DecodeError;
};
export { Entity, pluralize } from './entity';
export { CustomError } from './custom_error';
export { ExpectedAnyOf } from './expected_any_of';
export { ExpectedAtLeast } from './expected_at_least';
export { ExpectedEoi } from './expected_eoi';
export { ExpectedField } from './expected_field';
export { ExpectedMatch } from './expected_match';
export { ExpectedNoneOf } from './expected_none_of';
export { ExpectedOnce } from './expected_once';
export { PatternMismatch } from './pattern_mismatch';
export { UnexpectedEoi } from './unexpected_eoi';
