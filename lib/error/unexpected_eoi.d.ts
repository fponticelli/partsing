import { DecodeErrorBase } from './decode_error_base';
export declare class UnexpectedEoi extends DecodeErrorBase {
    readonly kind: 'unexpected-eot-error';
    constructor();
    toString(): string;
}
