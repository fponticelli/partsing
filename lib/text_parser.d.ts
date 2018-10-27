import { Parser } from './parser';
import { ParseResult } from './parse_result';
export interface TextSource {
    readonly source: string;
    readonly index: number;
}
export declare type TextParser<T> = Parser<T, string, TextSource>;
export declare const parse: <T>(parser: Parser<T, string, TextSource>, source: string) => ParseResult<T, string, TextSource>;
export declare const regexp: (pattern: RegExp, group?: number) => Parser<string, string, TextSource>;
export declare const index: () => Parser<number, string, TextSource>;
export declare const rest: () => Parser<string, string, TextSource>;
export declare const eot: () => Parser<undefined, string, TextSource>;
export declare const match: <V extends string>(s: V) => Parser<V, string, TextSource>;
export declare const letter: () => Parser<string, string, TextSource>;
export declare const letters: (min?: number, max?: number | undefined) => Parser<string, string, TextSource>;
export declare const digit: () => Parser<string, string, TextSource>;
export declare const digits: (min?: number, max?: number | undefined) => Parser<string, string, TextSource>;
export declare const whitespace: () => Parser<string, string, TextSource>;
export declare const optionalWhitespace: () => Parser<string, string, TextSource>;
export declare const char: () => Parser<string, string, TextSource>;
export declare const testChar: (f: (c: string) => boolean) => Parser<string, string, TextSource>;
export declare const matchOneOf: (anyOf: string) => Parser<string, string, TextSource>;
export declare const matchNoneOf: (noneOf: string) => Parser<string, string, TextSource>;
export declare const takeWhile: (f: (c: string) => boolean, atLeast?: number) => Parser<string, string, TextSource>;
export declare const takeBetween: (f: (c: string) => boolean, min: number, max: number) => Parser<string, string, TextSource>;
