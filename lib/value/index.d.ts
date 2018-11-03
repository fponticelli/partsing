import { Decoder } from '../core/decoder';
import { DecodeResult } from '../core/result';
export interface ValueInput {
    readonly input: any;
    readonly path: (string | number)[];
}
export declare type ValueDecoder<T> = Decoder<ValueInput, T, string>;
export declare const decodeValue: <T>(decoder: Decoder<ValueInput, T, string>, input: any) => DecodeResult<ValueInput, T, string>;
export declare const testValue: <T>(f: (input: T) => boolean, expected: string) => Decoder<ValueInput, T, string>;
export declare const testType: <T>(expected: string) => Decoder<ValueInput, T, string>;
export declare const nullableValue: <T>(decoder: Decoder<ValueInput, T, string>) => Decoder<ValueInput, T | null, string>;
export declare const undefineableValue: <T>(decoder: Decoder<ValueInput, T, string>) => Decoder<ValueInput, T | undefined, string>;
export declare const optionalValue: <T>(decoder: Decoder<ValueInput, T, string>) => Decoder<ValueInput, T | null | undefined, string>;
export declare const anyValue: Decoder<ValueInput, any, string>;
export declare const stringValue: Decoder<ValueInput, string, string>;
export declare const numberValue: Decoder<ValueInput, number, string>;
export declare const integerValue: Decoder<ValueInput, number, string>;
export declare const safeIntegerValue: Decoder<ValueInput, number, string>;
export declare const finiteNumberValue: Decoder<ValueInput, number, string>;
export declare const booleanValue: Decoder<ValueInput, boolean, string>;
export declare const undefinedValue: Decoder<ValueInput, undefined, string>;
export declare const nullValue: Decoder<ValueInput, null, string>;
export declare const literalValue: <T>(value: T, eq?: (a: T, b: T) => boolean) => Decoder<ValueInput, T, string>;
export declare const anyArrayValue: Decoder<ValueInput, any[], string>;
export declare const arrayValue: <T>(decoder: Decoder<ValueInput, T, string>) => Decoder<ValueInput, T[], string>;
export declare const tupleValue: <U extends any[]>(...decoders: { [k in keyof U]: Decoder<ValueInput, U[k], string>; }) => Decoder<ValueInput, U, string>;
export declare const objectValue: <T, K extends keyof T>(fieldDecoders: { [k in keyof T]: Decoder<ValueInput, T[k], string>; }, ...optionalFields: K[]) => Decoder<ValueInput, { [k in Exclude<keyof T, K>]: T[k]; } & { [k in K]+?: T[k] | undefined; }, string>;
