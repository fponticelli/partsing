import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './Entity';
export declare class ExpectedAtLeast extends DecodeErrorBase {
    readonly min: number;
    readonly entity: Entity;
    readonly kind: 'expected-at-least';
    constructor(min: number, entity: Entity);
    toString(): string;
}
