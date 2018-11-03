import { DecodeErrorBase } from './decode_error_base';
export declare class ExpectedField extends DecodeErrorBase {
    readonly field: string;
    readonly kind: 'expected-field';
    constructor(field: string);
    toString(): string;
}
