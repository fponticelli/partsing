"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parse_result_1 = require("./parse_result");
var Parser = /** @class */ (function () {
    function Parser(run) {
        this.run = run;
    }
    Parser.of = function (run) {
        return new Parser(run);
    };
    Parser.ofGuaranteed = function (run) {
        return new Parser(function (source) {
            return parse_result_1.ParseResult.success.apply(parse_result_1.ParseResult, run(source));
        });
    };
    Parser.prototype.flatMap = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            var result = _this.run(source);
            if (result.isSuccess()) {
                return fun(result.value).run(result.source);
            }
            else {
                return new parse_result_1.ParseFailure(source, result.failure);
            }
        });
    };
    Parser.prototype.map = function (fun) {
        return this.flatMap(function (r) { return new Parser(function (source) {
            return new parse_result_1.ParseSuccess(source, fun(r));
        }); });
    };
    Parser.prototype.flatMapError = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            return _this.run(source).match({
                failure: function (f) { return fun(f.failure).run(source); },
                success: function (s) { return new parse_result_1.ParseSuccess(s.source, s.value); }
            });
        });
    };
    Parser.prototype.mapError = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            return _this.run(source).match({
                failure: function (f) { return new parse_result_1.ParseFailure(f.source, fun(f.failure)); },
                success: function (s) { return new parse_result_1.ParseSuccess(s.source, s.value); }
            });
        });
    };
    Parser.prototype.pickNext = function (next) {
        return this.flatMap(function (_) { return next; });
    };
    Parser.prototype.skipNext = function (next) {
        return this.flatMap(function (r) { return next.withResult(r); });
    };
    Parser.prototype.join = function (other) {
        return this.flatMap(function (res) {
            return other.map(function (o) { return [res, o]; });
        });
    };
    Parser.prototype.or = function () {
        var parsers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parsers[_i] = arguments[_i];
        }
        return this.flatMapError(function (f) {
            return new Parser(function (source) {
                for (var _i = 0, parsers_1 = parsers; _i < parsers_1.length; _i++) {
                    var parser = parsers_1[_i];
                    var result = parser.run(source);
                    if (result.isFailure()) {
                        f = result.failure;
                    }
                    else {
                        return result;
                    }
                }
                return new parse_result_1.ParseFailure(source, f);
            });
        });
    };
    Parser.prototype.repeatAtLeast = function (times) {
        var _this = this;
        if (times === void 0) { times = 1; }
        return new Parser(function (source) {
            var buff = [];
            while (true) {
                var result = _this.run(source);
                if (result.isSuccess()) {
                    buff.push(result.value);
                    source = result.source;
                }
                else if (buff.length < times) {
                    return new parse_result_1.ParseFailure(source, result.failure);
                }
                else {
                    return new parse_result_1.ParseSuccess(source, buff);
                }
            }
        });
    };
    Parser.prototype.repeatBetween = function (min, max) {
        var _this = this;
        return new Parser(function (source) {
            var buff = [];
            var failure = undefined;
            for (var i = 0; i < max; i++) {
                var result = _this.run(source);
                if (result.isSuccess()) {
                    buff.push(result.value);
                    source = result.source;
                }
                else {
                    failure = result.failure;
                    break;
                }
            }
            if (buff.length < min) {
                return new parse_result_1.ParseFailure(source, failure);
            }
            return new parse_result_1.ParseSuccess(source, buff);
        });
    };
    Parser.prototype.repeat = function (times) {
        return this.repeatBetween(times, times);
    };
    Parser.prototype.repeatAtMost = function (times) {
        return this.repeatBetween(0, times);
    };
    Parser.prototype.separatedByAtLeastOnce = function (separator) {
        var pairs = separator.pickNext(this).repeatAtLeast(1);
        return this.flatMap(function (res) { return pairs.map(function (rs) { return [res].concat(rs); }); });
    };
    Parser.prototype.separatedBy = function (separator) {
        return this.separatedByAtLeastOnce(separator)
            .or(this.map(function (v) { return [v]; }))
            .or(exports.succeed([]));
    };
    Parser.prototype.probe = function (f) {
        var _this = this;
        return new Parser(function (source) {
            var result = _this.run(source);
            f(result);
            return result;
        });
    };
    Parser.prototype.withResult = function (value) {
        return this.map(function (_) { return value; });
    };
    Parser.prototype.withFailure = function (e) {
        return this.mapError(function (_) { return e; });
    };
    return Parser;
}());
exports.Parser = Parser;
exports.sequence = function () {
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    return new Parser(function (source) {
        var buff = [];
        for (var i = 0; i < parsers.length; i++) {
            var parser = parsers[i];
            var result = parser.run(source);
            if (result.isFailure()) {
                return new parse_result_1.ParseFailure(source, result.failure);
            }
            else {
                source = result.source;
                buff[i] = result.value;
            }
        }
        return new parse_result_1.ParseSuccess(source, buff);
    });
};
exports.oneOf = function () {
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    if (parsers.length === 0)
        throw new Error('alt needs to be called with at least one argumenr');
    return new Parser(function (source) {
        var failure = undefined;
        for (var _i = 0, parsers_2 = parsers; _i < parsers_2.length; _i++) {
            var parser = parsers_2[_i];
            var result = parser.run(source);
            if (result.isFailure()) {
                failure = result;
            }
            else {
                return result;
            }
        }
        return failure;
    });
};
exports.succeed = function (r) {
    return new Parser(function (source) { return new parse_result_1.ParseSuccess(source, r); });
};
exports.fail = function (f) {
    return new Parser(function (source) { return new parse_result_1.ParseFailure(source, f); });
};
exports.lazy = function (f) {
    var parser;
    return Parser.of(function (source) {
        if (parser === undefined)
            parser = f();
        return parser.run(source);
    });
};
//# sourceMappingURL=parser.js.map