import { ParseResult } from './result';
import { TupleToUnion } from './type_level';
export declare type Parsing<In, Out, Err> = (input: In) => ParseResult<In, Out, Err>;
export declare class Parser<In, Out, Err> {
    readonly run: (input: In) => ParseResult<In, Out, Err>;
    static of<In, Out, Err>(run: (input: In) => ParseResult<In, Out, Err>): Parser<In, Out, Err>;
    static ofGuaranteed<In, Out, Err>(run: (input: In) => [In, Out]): Parser<In, Out, Err>;
    constructor(run: (input: In) => ParseResult<In, Out, Err>);
    flatMap<Out2>(fun: (res: Out) => Parser<In, Out2, Err>): Parser<In, Out2, Err>;
    map<Out2>(fun: (res: Out) => Out2): Parser<In, Out2, Err>;
    flatMapError<Err2>(fun: (res: Err) => Parser<In, Out, Err2>): Parser<In, Out, Err2>;
    mapError<Err2>(fun: (e: Err) => Err2): Parser<In, Out, Err2>;
    pickNext<Out2>(next: Parser<In, Out2, Err>): Parser<In, Out2, Err>;
    skipNext<Out2>(next: Parser<In, Out2, Err>): Parser<In, Out, Err>;
    join<Out2>(other: Parser<In, Out2, Err>): Parser<In, [Out, Out2], Err>;
    or<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<In, U[P], Err>;
    }): Parser<In, Out | TupleToUnion<U>, Err>;
    repeatAtLeast(times?: number): Parser<In, Out[], Err>;
    repeatBetween(min: number, max: number): Parser<In, Out[], Err>;
    repeat(times: number): Parser<In, Out[], Err>;
    repeatAtMost(times: number): Parser<In, Out[], Err>;
    separatedByAtLeastOnce<Separator>(separator: Parser<In, Separator, Err>): Parser<In, Out[], Err>;
    separatedBy<Separator>(separator: Parser<In, Separator, Err>): Parser<In, Out[], Err>;
    test(predicate: (r: Out) => boolean, failure: Err): Parser<In, Out, Err>;
    probe(f: (v: ParseResult<In, Out, Err>) => void): Parser<In, Out, Err>;
    withResult<Out2>(value: Out2): Parser<In, Out2, Err>;
    withFailure<Err2>(e: Err2): Parser<In, Out, Err2>;
}
export declare const sequence: <In, U extends any[], Err>(...parsers: { [P in keyof U]: Parser<In, U[P], Err>; }) => Parser<In, { [P in keyof U]: U[P]; }, Err>;
export declare const oneOf: <In, U extends any[], Err>(...parsers: { [P in keyof U]: Parser<In, U[P], Err>; }) => Parser<In, U[number], Err>;
export declare const succeed: <In, Out, Err>(r: Out) => Parser<In, Out, Err>;
export declare const fail: <In, Out, Err>(f: Err) => Parser<In, Out, Err>;
export declare const lazy: <In, Out, Err>(f: () => Parser<In, Out, Err>) => Parser<In, Out, Err>;
