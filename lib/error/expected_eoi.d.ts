import { DecodeErrorBase } from './decode_error_base';
export declare class ExpectedEoi extends DecodeErrorBase {
    readonly kind: 'expected-eot-error';
    constructor();
    toString(): string;
}
