import { DecodeErrorBase } from './decode_error_base';
export declare class UnexpectedEoi extends DecodeErrorBase {
    readonly kind: 'unexpected-eoi';
    constructor();
    toString(): string;
}
