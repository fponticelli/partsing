import { Parser } from './parser';
import { ParseResult } from './parse_result';
export interface TextInput {
    readonly input: string;
    readonly index: number;
}
export declare type TextParser<T> = Parser<T, string, TextInput>;
export declare const parseText: <T>(parser: Parser<T, string, TextInput>, input: string) => ParseResult<T, string, TextInput>;
export declare const regexp: (pattern: RegExp, group?: number) => Parser<string, string, TextInput>;
export declare const withPosition: Parser<number, string, TextInput>;
export declare const rest: Parser<string, string, TextInput>;
export declare const eot: Parser<{} | undefined, string, TextInput>;
export declare const match: <V extends string>(s: V) => Parser<V, string, TextInput>;
export declare const letter: Parser<string, string, TextInput>;
export declare const letters: (min?: number, max?: number | undefined) => Parser<string, string, TextInput>;
export declare const upperCaseLetter: Parser<string, string, TextInput>;
export declare const upperCaseLetters: (min?: number, max?: number | undefined) => Parser<string, string, TextInput>;
export declare const lowerCaseLetter: Parser<string, string, TextInput>;
export declare const lowerCaseLetters: (min?: number, max?: number | undefined) => Parser<string, string, TextInput>;
export declare const digit: Parser<string, string, TextInput>;
export declare const digits: (min?: number, max?: number | undefined) => Parser<string, string, TextInput>;
export declare const whitespace: Parser<string, string, TextInput>;
export declare const optionalWhitespace: Parser<string, string, TextInput>;
export declare const char: Parser<{}, string, TextInput>;
export declare const testChar: (f: (c: string) => boolean) => Parser<string, string, TextInput>;
export declare const matchAnyCharOf: (anyOf: string) => Parser<string, string, TextInput>;
export declare const matchNoCharOf: (noneOf: string) => Parser<string, string, TextInput>;
export declare const takeCharWhile: (f: (c: string) => boolean, atLeast?: number) => Parser<string, string, TextInput>;
export declare const takeCharBetween: (f: (c: string) => boolean, min: number, max: number) => Parser<string, string, TextInput>;
