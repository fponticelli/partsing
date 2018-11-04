declare abstract class DecodeResultBase<In, Out, Err> {
    readonly input: In;
    readonly _I: In;
    readonly _O: Out;
    readonly _E: Err;
    constructor(input: In);
    abstract match<O>(o: {
        success: (s: DecodeSuccess<In, Out, Err>) => O;
        failure: (f: DecodeFailure<In, Out, Err>) => O;
    }): O;
    abstract flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err>;
    abstract flatMapError<Err2>(f: (r: Err) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2>;
    abstract map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err>;
    abstract mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2>;
    abstract isSuccess(): this is DecodeSuccess<In, Out, Err>;
    abstract isFailure(): this is DecodeFailure<In, Out, Err>;
    abstract getUnsafeSuccess(): Out;
    abstract getUnsafeFailure(): Err;
    abstract toString(): string;
}
export declare class DecodeSuccess<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
    readonly value: Out;
    readonly kind = "decode-success";
    constructor(input: In, value: Out);
    match<O>(o: {
        success: (s: DecodeSuccess<In, Out, Err>) => O;
        failure: (f: DecodeFailure<In, Out, Err>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err>;
    map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err>;
    flatMapError<Err2>(f: (r: Err) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2>;
    mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2>;
    isSuccess(): this is DecodeSuccess<In, Out, Err>;
    isFailure(): this is DecodeFailure<In, Out, Err>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare class DecodeFailure<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
    readonly failure: Err;
    readonly kind = "decode-failure";
    constructor(input: In, failure: Err);
    match<O>(o: {
        success: (succ: DecodeSuccess<In, Out, Err>) => O;
        failure: (fail: DecodeFailure<In, Out, Err>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err>;
    map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err>;
    flatMapError<Err2>(f: (r: Err) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2>;
    mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2>;
    isSuccess(): this is DecodeSuccess<In, Out, Err>;
    isFailure(): this is DecodeFailure<In, Out, Err>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare type DecodeResult<In, Out, Err> = DecodeSuccess<In, Out, Err> | DecodeFailure<In, Out, Err>;
export declare const DecodeResult: {
    success: <In, Out, Err>(input: In, result: Out) => DecodeResult<In, Out, Err>;
    failure: <In, Out, Err>(input: In, failure: Err) => DecodeResult<In, Out, Err>;
};
export {};
