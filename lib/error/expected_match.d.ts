import { DecodeErrorBase } from './decode_error_base';
export declare class ExpectedMatch extends DecodeErrorBase {
    readonly value: string;
    readonly kind: 'match-error';
    constructor(value: string);
    toString(): string;
}
