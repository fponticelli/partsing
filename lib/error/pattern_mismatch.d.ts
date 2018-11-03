import { DecodeErrorBase } from './decode_error_base';
export declare class PatternMismatch extends DecodeErrorBase {
    readonly pattern: string;
    readonly kind: 'pattern-mismatch';
    constructor(pattern: string);
    toString(): string;
}
