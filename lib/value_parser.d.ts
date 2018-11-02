import { Parser } from './parser';
import { ParseResult } from './parse_result';
export interface ValueInput {
    readonly input: any;
    readonly path: (string | number)[];
}
export declare type ValueParser<T> = Parser<T, string, ValueInput>;
export declare const parseValue: <T>(parser: Parser<T, string, ValueInput>, input: any) => ParseResult<T, string, ValueInput>;
export declare const testValue: <T>(f: (input: T) => boolean, expected: string) => Parser<T, string, ValueInput>;
export declare const testType: <T>(expected: string) => Parser<T, string, ValueInput>;
export declare const nullableValue: <T>(parser: Parser<T, string, ValueInput>) => Parser<T | null, string, ValueInput>;
export declare const undefineableValue: <T>(parser: Parser<T, string, ValueInput>) => Parser<T | undefined, string, ValueInput>;
export declare const optionalValue: <T>(parser: Parser<T, string, ValueInput>) => Parser<T | null | undefined, string, ValueInput>;
export declare const anyValue: Parser<any, string, ValueInput>;
export declare const stringValue: Parser<string, string, ValueInput>;
export declare const numberValue: Parser<number, string, ValueInput>;
export declare const integerValue: Parser<number, string, ValueInput>;
export declare const safeIntegerValue: Parser<number, string, ValueInput>;
export declare const finiteNumberValue: Parser<number, string, ValueInput>;
export declare const booleanValue: Parser<boolean, string, ValueInput>;
export declare const undefinedValue: Parser<undefined, string, ValueInput>;
export declare const nullValue: Parser<null, string, ValueInput>;
export declare const literalValue: <T>(value: T, eq?: (a: T, b: T) => boolean) => Parser<T, string, ValueInput>;
export declare const anyArrayValue: Parser<any[], string, ValueInput>;
export declare const arrayValue: <T>(parser: Parser<T, string, ValueInput>) => Parser<T[], string, ValueInput>;
export declare const tupleValue: <U extends any[]>(...parsers: { [k in keyof U]: Parser<U[k], string, ValueInput>; }) => Parser<U, string, ValueInput>;
export declare const objectValue: <T, K extends keyof T>(fieldParsers: { [k in keyof T]: Parser<T[k], string, ValueInput>; }, ...optionalFields: K[]) => Parser<{ [k in Exclude<keyof T, K>]: T[k]; } & { [k in K]+?: T[k] | undefined; }, string, ValueInput>;
