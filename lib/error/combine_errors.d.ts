import { DecodeError } from './';
import { DecodeErrorBase } from './decode_error_base';
export declare class CombineErrors extends DecodeErrorBase {
    readonly errors: DecodeError[];
    readonly kind: 'combine-errors';
    constructor(errors: DecodeError[]);
    toString(): string;
}
