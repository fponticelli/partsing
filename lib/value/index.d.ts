import { Parser } from '../core/parser';
import { ParseResult } from '../core/result';
export interface ValueInput {
    readonly input: any;
    readonly path: (string | number)[];
}
export declare type ValueParser<T> = Parser<ValueInput, T, string>;
export declare const parseValue: <T>(parser: Parser<ValueInput, T, string>, input: any) => ParseResult<ValueInput, T, string>;
export declare const testValue: <T>(f: (input: T) => boolean, expected: string) => Parser<ValueInput, T, string>;
export declare const testType: <T>(expected: string) => Parser<ValueInput, T, string>;
export declare const nullableValue: <T>(parser: Parser<ValueInput, T, string>) => Parser<ValueInput, T | null, string>;
export declare const undefineableValue: <T>(parser: Parser<ValueInput, T, string>) => Parser<ValueInput, T | undefined, string>;
export declare const optionalValue: <T>(parser: Parser<ValueInput, T, string>) => Parser<ValueInput, T | null | undefined, string>;
export declare const anyValue: Parser<ValueInput, any, string>;
export declare const stringValue: Parser<ValueInput, string, string>;
export declare const numberValue: Parser<ValueInput, number, string>;
export declare const integerValue: Parser<ValueInput, number, string>;
export declare const safeIntegerValue: Parser<ValueInput, number, string>;
export declare const finiteNumberValue: Parser<ValueInput, number, string>;
export declare const booleanValue: Parser<ValueInput, boolean, string>;
export declare const undefinedValue: Parser<ValueInput, undefined, string>;
export declare const nullValue: Parser<ValueInput, null, string>;
export declare const literalValue: <T>(value: T, eq?: (a: T, b: T) => boolean) => Parser<ValueInput, T, string>;
export declare const anyArrayValue: Parser<ValueInput, any[], string>;
export declare const arrayValue: <T>(parser: Parser<ValueInput, T, string>) => Parser<ValueInput, T[], string>;
export declare const tupleValue: <U extends any[]>(...parsers: { [k in keyof U]: Parser<ValueInput, U[k], string>; }) => Parser<ValueInput, U, string>;
export declare const objectValue: <T, K extends keyof T>(fieldParsers: { [k in keyof T]: Parser<ValueInput, T[k], string>; }, ...optionalFields: K[]) => Parser<ValueInput, { [k in Exclude<keyof T, K>]: T[k]; } & { [k in K]+?: T[k] | undefined; }, string>;
