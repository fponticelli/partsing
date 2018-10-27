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
    Parser.prototype.then = function (next) {
        return this.flatMap(function (_) { return next; });
    };
    Parser.prototype.result = function (value) {
        return this.map(function (_) { return value; });
    };
    Parser.prototype.skip = function (next) {
        return this.flatMap(function (r) { return next.result(r); });
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
                for (var i = 0; i < parsers.length; i++) {
                    var parser = parsers[i];
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
    Parser.prototype.many = function (atLeast) {
        var _this = this;
        if (atLeast === void 0) { atLeast = 1; }
        return new Parser(function (source) {
            var buff = [];
            while (true) {
                var result = _this.run(source);
                if (result.isSuccess()) {
                    buff.push(result.value);
                    source = result.source;
                }
                else if (buff.length < atLeast) {
                    return new parse_result_1.ParseFailure(source, result.failure);
                }
                else {
                    return new parse_result_1.ParseSuccess(source, buff);
                }
            }
        });
    };
    Parser.prototype.between = function (min, max) {
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
    Parser.prototype.times = function (count) {
        return this.between(count, count);
    };
    Parser.prototype.atMost = function (times) {
        return this.between(0, times);
    };
    Parser.prototype.separatedByAtLeastOnce = function (separator) {
        var pairs = separator.then(this).many(1);
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
    Parser.prototype.as = function (e) {
        return this.mapError(function (_) { return e; });
    };
    return Parser;
}());
exports.Parser = Parser;
exports.seq = function () {
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
exports.alt = function () {
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    if (parsers.length === 0)
        throw new Error('alt needs to be called with at least one argumenr');
    return new Parser(function (source) {
        var failure = undefined;
        for (var i = 0; i < parsers.length; i++) {
            var parser = parsers[i];
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
exports.many = function (parser, atLeast) {
    if (atLeast === void 0) { atLeast = 1; }
    return parser.many(atLeast);
};
exports.between = function (parser, min, max) {
    return parser.between(min, max);
};
exports.times = function (parser, count) {
    return parser.times(count);
};
exports.atMost = function (parser, times) {
    return parser.atMost(times);
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