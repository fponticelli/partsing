"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ParseResultBase = /** @class */ (function () {
    function ParseResultBase(source) {
        this.source = source;
    }
    return ParseResultBase;
}());
var ParseSuccess = /** @class */ (function (_super) {
    __extends(ParseSuccess, _super);
    function ParseSuccess(source, value) {
        var _this = _super.call(this, source) || this;
        _this.value = value;
        _this.kind = 'parse-success';
        return _this;
    }
    ParseSuccess.prototype.match = function (o) {
        return o.success(this);
    };
    ParseSuccess.prototype.flatMap = function (f) {
        return f(this.value);
    };
    ParseSuccess.prototype.map = function (f) {
        var _this = this;
        return this.flatMap(function (v) { return new ParseSuccess(_this.source, f(v)); });
    };
    ParseSuccess.prototype.flatMapError = function (f) {
        return new ParseSuccess(this.source, this.value);
    };
    ParseSuccess.prototype.mapError = function (f) {
        return new ParseSuccess(this.source, this.value);
    };
    ParseSuccess.prototype.toString = function () {
        return "ParseSuccess<" + JSON.stringify(this.value) + ">: " + JSON.stringify(this.source);
    };
    return ParseSuccess;
}(ParseResultBase));
exports.ParseSuccess = ParseSuccess;
var ParseFailure = /** @class */ (function (_super) {
    __extends(ParseFailure, _super);
    function ParseFailure(source, failure) {
        var _this = _super.call(this, source) || this;
        _this.failure = failure;
        _this.kind = 'parse-failure';
        return _this;
    }
    ParseFailure.prototype.match = function (o) {
        return o.failure(this);
    };
    ParseFailure.prototype.flatMap = function (f) {
        return new ParseFailure(this.source, this.failure);
    };
    ParseFailure.prototype.map = function (f) {
        return new ParseFailure(this.source, this.failure);
    };
    ParseFailure.prototype.flatMapError = function (f) {
        return f(this.failure);
    };
    ParseFailure.prototype.mapError = function (f) {
        var _this = this;
        return this.flatMapError(function (e) { return new ParseFailure(_this.source, f(e)); });
    };
    ParseFailure.prototype.toString = function () {
        return "ParseFailure<" + JSON.stringify(this.failure) + ">: " + JSON.stringify(this.source);
    };
    return ParseFailure;
}(ParseResultBase));
exports.ParseFailure = ParseFailure;
var Parser = /** @class */ (function () {
    function Parser(run) {
        this.run = run;
    }
    Parser.prototype.flatMap = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            return _this.run(source).match({
                failure: function (f) { return new ParseFailure(f.source, f.failure); },
                success: function (s) { return fun(s.value).run(s.source); }
            });
        });
    };
    Parser.prototype.map = function (fun) {
        var _this = this;
        return this.flatMap(function (r) { return new Parser(function (source) {
            return _this.run(source).map(fun);
        }); });
    };
    Parser.prototype.flatMapError = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            return _this.run(source).match({
                failure: function (f) { return fun(f.failure).run(source); },
                success: function (s) { return new ParseSuccess(s.source, s.value); }
            });
        });
    };
    Parser.prototype.mapError = function (fun) {
        var _this = this;
        return new Parser(function (source) {
            return _this.run(source).match({
                failure: function (f) { return new ParseFailure(f.source, fun(f.failure)); },
                success: function (s) { return new ParseSuccess(s.source, s.value); }
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
    Parser.prototype.join = function () {
        var parsers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parsers[_i] = arguments[_i];
        }
        return this.flatMap(function (res) {
            return new Parser(function (source) {
                var buff = [];
                for (var i = 0; i < parsers.length; i++) {
                    var parser = parsers[i];
                    var result = parser.run(source);
                    if (result.kind === 'parse-failure') {
                        return new ParseFailure(source, result.failure);
                    }
                    else {
                        source = result.source;
                        buff[i] = result.value;
                    }
                }
                return new ParseSuccess(source, [res].concat(buff));
            });
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
                    if (result.kind === 'parse-failure') {
                        f = result.failure;
                    }
                    else {
                        return result;
                    }
                }
                return new ParseFailure(source, f);
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
                if (result.kind === 'parse-success') {
                    buff.push(result.value);
                    source = result.source;
                }
                else if (buff.length < atLeast) {
                    return new ParseFailure(source, result.failure);
                }
                else {
                    return new ParseSuccess(result.source, buff);
                }
            }
        });
    };
    Parser.prototype.between = function (min, max) {
        var _this = this;
        return new Parser(function (source) {
            var buff = [];
            for (var i = 0; i < max; i++) {
                var result = _this.run(source);
                if (result.kind === 'parse-success') {
                    buff.push(result.value);
                    source = result.source;
                }
                else if (buff.length < min) {
                    return new ParseFailure(source, result.failure);
                }
                else {
                    return new ParseSuccess(result.source, buff);
                }
            }
            return new ParseSuccess(source, buff);
        });
    };
    Parser.prototype.times = function (count) {
        return this.between(count, count);
    };
    Parser.prototype.atMost = function (times) {
        return this.between(0, times);
    };
    Parser.prototype.separatedByAtLeastOnce = function (separator) {
        var pairs = separator.then(this).many();
        return this.flatMap(function (res) { return pairs.map(function (rs) { return [res].concat(rs); }); });
    };
    Parser.prototype.separatedBy = function (separator) {
        return this.separatedByAtLeastOnce(separator).or(exports.succeed([]));
    };
    Parser.prototype.probe = function (f) {
        var _this = this;
        return new Parser(function (source) {
            var result = _this.run(source);
            f(result);
            return result;
        });
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
            if (result.kind === 'parse-failure') {
                return new ParseFailure(source, result.failure);
            }
            else {
                source = result.source;
                buff[i] = result.value;
            }
        }
        return new ParseSuccess(source, buff);
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
            if (result.kind === 'parse-failure') {
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
    return new Parser(function (source) { return new ParseSuccess(source, r); });
};
exports.fail = function (f) {
    return new Parser(function (source) { return new ParseFailure(source, f); });
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
exports.separatedByAtLeastOnce = function (parser, separator) {
    return parser.separatedByAtLeastOnce(separator);
};
exports.separatedBy = function (parser, separator) {
    return parser.separatedBy(separator);
};
//# sourceMappingURL=parse.js.map