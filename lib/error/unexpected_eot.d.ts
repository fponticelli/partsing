import { DecodeErrorBase } from './decode_error_base';
export declare class UnexpectedEOI extends DecodeErrorBase {
    readonly kind: 'unexpected-eot-error';
    constructor();
    toString(): string;
}
