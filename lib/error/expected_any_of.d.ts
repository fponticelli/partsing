import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './Entity';
export declare class ExpectedAnyOf extends DecodeErrorBase {
    readonly entity: Entity;
    readonly values: string[];
    readonly kind: 'any-of-error';
    constructor(entity: Entity, values: string[]);
    toString(): string;
}
