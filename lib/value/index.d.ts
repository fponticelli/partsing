import { Decoder } from '../core/decoder';
import { DecodeResult, DecodeFailure } from '../core/result';
import { DecodeError } from '../error';
export interface ValueInput {
    readonly input: any;
    readonly path: (string | number)[];
}
export declare type ValueDecoder<T> = Decoder<ValueInput, T, DecodeError>;
export declare const decodeValue: <T>(decoder: Decoder<ValueInput, T, DecodeError>) => (input: any) => DecodeResult<any, T, string>;
export declare const testValue: <T>(f: (input: T) => boolean, expected: string) => Decoder<ValueInput, T, DecodeError>;
export declare const testType: <T>(expected: string) => Decoder<ValueInput, T, DecodeError>;
export declare const nullableValue: <T>(decoder: Decoder<ValueInput, T, DecodeError>) => Decoder<ValueInput, T | null, DecodeError>;
export declare const undefineableValue: <T>(decoder: Decoder<ValueInput, T, DecodeError>) => Decoder<ValueInput, T | undefined, DecodeError>;
export declare const optionalValue: <T>(decoder: Decoder<ValueInput, T, DecodeError>) => Decoder<ValueInput, T | null | undefined, DecodeError>;
export declare const anyValue: Decoder<ValueInput, any, DecodeError>;
export declare const stringValue: Decoder<ValueInput, string, DecodeError>;
export declare const numberValue: Decoder<ValueInput, number, DecodeError>;
export declare const integerValue: Decoder<ValueInput, number, DecodeError>;
export declare const safeIntegerValue: Decoder<ValueInput, number, DecodeError>;
export declare const finiteNumberValue: Decoder<ValueInput, number, DecodeError>;
export declare const booleanValue: Decoder<ValueInput, boolean, DecodeError>;
export declare const undefinedValue: Decoder<ValueInput, undefined, DecodeError>;
export declare const nullValue: Decoder<ValueInput, null, DecodeError>;
export declare const literalValue: <T>(value: T, eq?: (a: T, b: T) => boolean) => Decoder<ValueInput, T, DecodeError>;
export declare const anyArrayValue: Decoder<ValueInput, any[], DecodeError>;
export declare const arrayValue: <T>(decoder: Decoder<ValueInput, T, DecodeError>) => Decoder<ValueInput, T[], DecodeError>;
export declare const tupleValue: <U extends any[]>(...decoders: { [k in keyof U]: Decoder<ValueInput, U[k], DecodeError>; }) => Decoder<ValueInput, U, DecodeError>;
export declare const objectValue: <T, K extends keyof T>(fieldDecoders: { [k in keyof T]: Decoder<ValueInput, T[k], DecodeError>; }, ...optionalFields: K[]) => Decoder<ValueInput, { [k in Exclude<keyof T, K>]: T[k]; } & { [k in K]+?: T[k] | undefined; }, DecodeError>;
export declare const failureToString: <Out>(err: DecodeFailure<ValueInput, Out, DecodeError>) => string;
