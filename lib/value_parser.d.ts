import { Parser } from './parser';
import { ParseResult } from './parse_result';
export interface ValueSource {
    readonly source: any;
    readonly path: (string | number)[];
}
export declare type ValueParser<T> = Parser<T, string, ValueSource>;
export declare const parseValue: <T>(parser: Parser<T, string, ValueSource>, source: any) => ParseResult<T, string, ValueSource>;
export declare const testValue: <T>(f: (source: T) => boolean, expected: string) => Parser<T, string, ValueSource>;
export declare const testType: <T>(expected: string) => Parser<T, string, ValueSource>;
export declare const nullableValue: <T>(parser: Parser<T, string, ValueSource>) => Parser<T | null, string, ValueSource>;
export declare const undefineableValue: <T>(parser: Parser<T, string, ValueSource>) => Parser<T | undefined, string, ValueSource>;
export declare const optionalValue: <T>(parser: Parser<T, string, ValueSource>) => Parser<T | null | undefined, string, ValueSource>;
export declare const anyValue: Parser<any, string, ValueSource>;
export declare const stringValue: Parser<string, string, ValueSource>;
export declare const numberValue: Parser<number, string, ValueSource>;
export declare const integerValue: Parser<number, string, ValueSource>;
export declare const safeIntegerValue: Parser<number, string, ValueSource>;
export declare const finiteNumberValue: Parser<number, string, ValueSource>;
export declare const booleanValue: Parser<boolean, string, ValueSource>;
export declare const undefinedValue: Parser<undefined, string, ValueSource>;
export declare const nullValue: Parser<null, string, ValueSource>;
export declare const literalValue: <T>(value: T, eq?: (a: T, b: T) => boolean) => Parser<T, string, ValueSource>;
export declare const anyArrayValue: Parser<any[], string, ValueSource>;
export declare const arrayValue: <T>(parser: Parser<T, string, ValueSource>) => Parser<T[], string, ValueSource>;
export declare const tupleValue: <U extends any[]>(...parsers: { [k in keyof U]: Parser<U[k], string, ValueSource>; }) => Parser<U, string, ValueSource>;
export declare const objectValue: <T, K extends keyof T>(fieldParsers: { [k in keyof T]: Parser<T[k], string, ValueSource>; }, ...optionalFields: K[]) => Parser<{ [k in Exclude<keyof T, K>]: T[k]; } & { [k in K]+?: T[k] | undefined; }, string, ValueSource>;
