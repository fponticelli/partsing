import { Parser } from './parser';
import { ParseResult } from './parse_result';
export interface TextInput {
    readonly input: string;
    readonly index: number;
}
export declare type TextParser<T> = Parser<TextInput, T, string>;
export declare const parseText: <T>(parser: Parser<TextInput, T, string>, input: string) => ParseResult<TextInput, T, string>;
export declare const regexp: (pattern: RegExp, group?: number) => Parser<TextInput, string, string>;
export declare const withPosition: Parser<TextInput, number, string>;
export declare const rest: Parser<TextInput, string, string>;
export declare const eot: Parser<TextInput, {} | undefined, string>;
export declare const match: <V extends string>(s: V) => Parser<TextInput, V, string>;
export declare const letter: Parser<TextInput, string, string>;
export declare const letters: (min?: number, max?: number | undefined) => Parser<TextInput, string, string>;
export declare const upperCaseLetter: Parser<TextInput, string, string>;
export declare const upperCaseLetters: (min?: number, max?: number | undefined) => Parser<TextInput, string, string>;
export declare const lowerCaseLetter: Parser<TextInput, string, string>;
export declare const lowerCaseLetters: (min?: number, max?: number | undefined) => Parser<TextInput, string, string>;
export declare const digit: Parser<TextInput, string, string>;
export declare const digits: (min?: number, max?: number | undefined) => Parser<TextInput, string, string>;
export declare const whitespace: Parser<TextInput, string, string>;
export declare const optionalWhitespace: Parser<TextInput, string, string>;
export declare const char: Parser<TextInput, {}, string>;
export declare const testChar: (f: (c: string) => boolean) => Parser<TextInput, string, string>;
export declare const matchAnyCharOf: (anyOf: string) => Parser<TextInput, string, string>;
export declare const matchNoCharOf: (noneOf: string) => Parser<TextInput, string, string>;
export declare const takeCharWhile: (f: (c: string) => boolean, atLeast?: number) => Parser<TextInput, string, string>;
export declare const takeCharBetween: (f: (c: string) => boolean, min: number, max: number) => Parser<TextInput, string, string>;
