import { DecodeErrorBase } from './decode_error_base';
import { DecodeError } from '.';
export declare class CombineError extends DecodeErrorBase {
    readonly errors: DecodeError[];
    readonly kind: 'combine-error';
    constructor(errors: DecodeError[]);
    toString(): string;
}
