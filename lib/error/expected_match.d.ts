import { DecodeErrorBase } from './decode_error_base';
export declare class ExpectedMatch extends DecodeErrorBase {
    readonly value: string;
    readonly kind: 'expected-match';
    constructor(value: string);
    toString(): string;
}
