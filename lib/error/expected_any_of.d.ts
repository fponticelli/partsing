import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './entity';
export declare const concatOr: (values: string[]) => string;
export declare class ExpectedAnyOf extends DecodeErrorBase {
    readonly entity: Entity;
    readonly values: string[];
    readonly kind: 'expected-any-of';
    constructor(entity: Entity, values: string[]);
    toString(): string;
}
