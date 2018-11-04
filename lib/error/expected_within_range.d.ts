import { DecodeErrorBase } from './decode_error_base';
export declare class ExpectedWithinRange extends DecodeErrorBase {
    readonly min: string;
    readonly max: string;
    readonly kind: 'expected-within-range';
    constructor(min: string, max: string);
    toString(): string;
}
