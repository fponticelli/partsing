import { DecodeErrorBase } from './decode_error_base';
import { Entity } from './entity';
export declare class ExpectedNoneOf extends DecodeErrorBase {
    readonly entity: Entity;
    readonly values: string[];
    readonly kind: 'no-char-of-error';
    constructor(entity: Entity, values: string[]);
    toString(): string;
}
