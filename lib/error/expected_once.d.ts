import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './Entity';
export declare class ExpectedOnce extends DecodeErrorBase {
    readonly entity: Entity;
    readonly kind: 'expected-once';
    constructor(entity: Entity);
    toString(): string;
}
