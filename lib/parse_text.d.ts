import { Parser, ParseResult } from './parse';
export interface TextSource {
    source: string;
    index: number;
}
export interface TextFailure {
    expected: string;
}
export declare type TextParser<T> = Parser<T, TextFailure, TextSource>;
export declare const expect: <T>(expected: string, parser: Parser<T, TextFailure, TextSource>) => Parser<T, TextFailure, TextSource>;
export declare const parse: <T>(parser: Parser<T, TextFailure, TextSource>, source: string) => ParseResult<T, TextFailure, TextSource>;
export declare const regexp: (pattern: RegExp, group?: number) => Parser<string, TextFailure, TextSource>;
export declare const index: () => Parser<number, TextFailure, TextSource>;
export declare const rest: () => Parser<string, TextFailure, TextSource>;
export declare const eot: () => Parser<unknown, TextFailure, TextSource>;
export declare const match: <V extends string>(s: V) => Parser<V, TextFailure, TextSource>;
export declare const lazy: <T>(f: () => Parser<T, TextFailure, TextSource>) => Parser<T, TextFailure, TextSource>;
export declare const letter: () => Parser<string, TextFailure, TextSource>;
export declare const letters: (min: number, max?: number | undefined) => Parser<string, TextFailure, TextSource>;
export declare const digit: () => Parser<string, TextFailure, TextSource>;
export declare const digits: (min: number, max?: number | undefined) => Parser<string, TextFailure, TextSource>;
export declare const whitespace: () => Parser<string, TextFailure, TextSource>;
export declare const optionalWhitespace: () => Parser<string, TextFailure, TextSource>;
export declare const char: () => Parser<string, TextFailure, TextSource>;
export declare const testChar: (f: (c: string) => boolean) => Parser<string, TextFailure, TextSource>;
export declare const matchOneOf: (anyOf: string) => Parser<string, TextFailure, TextSource>;
export declare const matchNoneOf: (noneOf: string) => Parser<string, TextFailure, TextSource>;
export declare const takeWhile: (f: (c: string) => boolean, atLeast?: number) => Parser<string, TextFailure, TextSource>;
export declare const takeBetween: (f: (c: string) => boolean, min: number, max: number) => Parser<string, TextFailure, TextSource>;
