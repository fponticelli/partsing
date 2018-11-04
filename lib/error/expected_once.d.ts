import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './entity';
export declare class ExpectedOnce extends DecodeErrorBase {
    readonly entity: Entity;
    readonly kind: 'expected-once';
    constructor(entity: Entity);
    toString(): string;
}
