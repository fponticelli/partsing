"use strict";
// Copyright 2018 Google LLC
Object.defineProperty(exports, "__esModule", { value: true });
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     https://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var result_1 = require("./result");
var Decoder = /** @class */ (function () {
    function Decoder(run) {
        this.run = run;
    }
    Decoder.of = function (run) {
        return new Decoder(run);
    };
    Decoder.ofGuaranteed = function (run) {
        return new Decoder(function (input) {
            return result_1.DecodeResult.success.apply(result_1.DecodeResult, run(input));
        });
    };
    Decoder.prototype.flatMap = function (fun) {
        var _this = this;
        return new Decoder(function (input) {
            var result = _this.run(input);
            if (result.isSuccess()) {
                return fun(result.value).run(result.input);
            }
            else {
                return new result_1.DecodeFailure(input, result.failure);
            }
        });
    };
    Decoder.prototype.map = function (fun) {
        return this.flatMap(function (r) { return new Decoder(function (input) {
            return new result_1.DecodeSuccess(input, fun(r));
        }); });
    };
    Decoder.prototype.sub = function (decoder, mapInput, mapError) {
        var _this = this;
        return new Decoder(function (input) {
            return _this.run(input).match({
                success: function (s) {
                    return decoder
                        .mapError(mapError)
                        .run(mapInput(s.value))
                        .mapInput(function (_) { return s.input; });
                },
                failure: function (f) { return result_1.DecodeResult.failure(f.input, f.failure); }
            });
        });
    };
    Decoder.prototype.flatMapError = function (fun) {
        var _this = this;
        return new Decoder(function (input) {
            return _this.run(input).match({
                failure: function (f) { return fun(f.failure).run(input); },
                success: function (s) { return new result_1.DecodeSuccess(s.input, s.value); }
            });
        });
    };
    Decoder.prototype.mapError = function (fun) {
        var _this = this;
        return new Decoder(function (input) {
            return _this.run(input).match({
                failure: function (f) { return new result_1.DecodeFailure(f.input, fun(f.failure)); },
                success: function (s) { return new result_1.DecodeSuccess(s.input, s.value); }
            });
        });
    };
    Decoder.prototype.pickNext = function (next) {
        return this.flatMap(function (_) { return next; });
    };
    Decoder.prototype.skipNext = function (next) {
        return this.flatMap(function (r) { return next.withResult(r); });
    };
    Decoder.prototype.join = function (other) {
        return this.flatMap(function (res) {
            return other.map(function (o) { return [res, o]; });
        });
    };
    Decoder.prototype.or = function (combineErrors) {
        var decoders = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            decoders[_i - 1] = arguments[_i];
        }
        return this.flatMapError(function (f) {
            return new Decoder(function (input) {
                var failures = [];
                for (var _i = 0, decoders_1 = decoders; _i < decoders_1.length; _i++) {
                    var decoder = decoders_1[_i];
                    var result = decoder.run(input);
                    if (result.isFailure()) {
                        failures.push(result.failure);
                    }
                    else {
                        return result;
                    }
                }
                if (combineErrors) {
                    return new result_1.DecodeFailure(input, combineErrors(failures));
                }
                else {
                    return new result_1.DecodeFailure(input, f);
                }
            });
        });
    };
    Decoder.prototype.repeatAtLeast = function (times) {
        var _this = this;
        if (times === void 0) { times = 1; }
        return new Decoder(function (input) {
            var buff = [];
            while (true) {
                var result = _this.run(input);
                if (result.isSuccess()) {
                    buff.push(result.value);
                    input = result.input;
                }
                else if (buff.length < times) {
                    return new result_1.DecodeFailure(input, result.failure);
                }
                else {
                    return new result_1.DecodeSuccess(input, buff);
                }
            }
        });
    };
    Decoder.prototype.repeatBetween = function (min, max) {
        var _this = this;
        return new Decoder(function (input) {
            var buff = [];
            var failure = undefined;
            for (var i = 0; i < max; i++) {
                var result = _this.run(input);
                if (result.isSuccess()) {
                    buff.push(result.value);
                    input = result.input;
                }
                else {
                    failure = result.failure;
                    break;
                }
            }
            if (buff.length < min) {
                return new result_1.DecodeFailure(input, failure);
            }
            return new result_1.DecodeSuccess(input, buff);
        });
    };
    Decoder.prototype.repeat = function (times) {
        return this.repeatBetween(times, times);
    };
    Decoder.prototype.repeatAtMost = function (times) {
        return this.repeatBetween(0, times);
    };
    Decoder.prototype.separatedByAtLeastOnce = function (separator) {
        var pairs = separator.pickNext(this).repeatAtLeast(1);
        return this.flatMap(function (res) { return pairs.map(function (rs) { return [res].concat(rs); }); });
    };
    Decoder.prototype.separatedBy = function (separator) {
        return this.separatedByAtLeastOnce(separator)
            .or(undefined, this.map(function (v) { return [v]; }))
            .or(undefined, exports.succeed([]));
    };
    Decoder.prototype.separatedByTimes = function (separator, times) {
        if (times <= 1)
            return this.map(function (v) { return [v]; });
        else {
            var pairs_1 = separator.pickNext(this).repeat(times - 1);
            return this.flatMap(function (res) { return pairs_1.map(function (rs) { return [res].concat(rs); }); });
        }
    };
    Decoder.prototype.test = function (predicate, failure) {
        return this.flatMap(function (res) { return new Decoder(function (input) {
            if (predicate(res)) {
                return result_1.DecodeResult.success(input, res);
            }
            else {
                return result_1.DecodeResult.failure(input, failure);
            }
        }); });
    };
    Decoder.prototype.probe = function (f) {
        var _this = this;
        return new Decoder(function (input) {
            var result = _this.run(input);
            f(result);
            return result;
        });
    };
    Decoder.prototype.withResult = function (value) {
        return this.map(function (_) { return value; });
    };
    Decoder.prototype.withFailure = function (e) {
        return this.mapError(function (_) { return e; });
    };
    return Decoder;
}());
exports.Decoder = Decoder;
exports.sequence = function () {
    var decoders = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        decoders[_i] = arguments[_i];
    }
    return new Decoder(function (input) {
        var buff = [];
        for (var i = 0; i < decoders.length; i++) {
            var decoder = decoders[i];
            var result = decoder.run(input);
            if (result.isFailure()) {
                return new result_1.DecodeFailure(input, result.failure);
            }
            else {
                input = result.input;
                buff[i] = result.value;
            }
        }
        return new result_1.DecodeSuccess(input, buff);
    });
};
exports.oneOf = function (combineErrors) {
    var decoders = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        decoders[_i - 1] = arguments[_i];
    }
    if (decoders.length === 0)
        throw new Error('alt needs to be called with at least one argumenr');
    return new Decoder(function (input) {
        var failures = [];
        for (var _i = 0, decoders_2 = decoders; _i < decoders_2.length; _i++) {
            var decoder = decoders_2[_i];
            var result = decoder.run(input);
            if (result.isFailure()) {
                failures.push(result.failure);
            }
            else {
                return result;
            }
        }
        if (combineErrors) {
            return result_1.DecodeResult.failure(input, combineErrors(failures));
        }
        else {
            return result_1.DecodeResult.failure(input, failures[0]);
        }
    });
};
exports.succeed = function (r) {
    return new Decoder(function (input) { return new result_1.DecodeSuccess(input, r); });
};
exports.fail = function (f) {
    return new Decoder(function (input) { return new result_1.DecodeFailure(input, f); });
};
exports.lazy = function (f) {
    var decoder;
    return Decoder.of(function (input) {
        if (decoder === undefined)
            decoder = f();
        return decoder.run(input);
    });
};
//# sourceMappingURL=decoder.js.map