import { DecodeErrorBase } from './decode_error_base';
export declare class CustomError extends DecodeErrorBase {
    readonly message: string;
    readonly kind: 'custom-error';
    constructor(message: string);
    toString(): string;
}
