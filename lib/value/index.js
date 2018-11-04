"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var decoder_1 = require("../core/decoder");
var result_1 = require("../core/result");
var error_1 = require("../error");
var make = function (f) {
    return new decoder_1.Decoder(f);
};
exports.decodeValue = function (decoder) { return function (input) {
    return decoder.run({ input: input, path: [] })
        .match({
        success: function (s) { return result_1.DecodeResult.success(input, s.value); },
        failure: function (f) { return result_1.DecodeResult.failure(input, exports.failureToString(f)); }
    });
}; };
exports.testValue = function (f, expected) { return make(function (input) {
    return f(input.input) ?
        result_1.DecodeResult.success(input, input.input) :
        result_1.DecodeResult.failure(input, error_1.DecodeError.expectedMatch(expected));
}); };
exports.testType = function (expected) { return make(function (input) {
    return typeof input.input === expected ?
        result_1.DecodeResult.success(input, input.input) :
        result_1.DecodeResult.failure(input, error_1.DecodeError.expectedMatch(expected));
}); };
exports.nullableValue = function (decoder) { return decoder.or(exports.nullValue); };
exports.undefineableValue = function (decoder) { return decoder.or(exports.undefinedValue); };
exports.optionalValue = function (decoder) { return decoder.or(exports.undefinedValue).or(exports.nullValue); };
exports.anyValue = make(function (input) { return result_1.DecodeResult.success(input, input.input); });
exports.stringValue = exports.testType('string');
exports.numberValue = exports.testType('number');
exports.integerValue = exports.numberValue.test(Number.isInteger, error_1.DecodeError.expectedMatch('integer'));
exports.safeIntegerValue = exports.numberValue.test(Number.isSafeInteger, error_1.DecodeError.expectedMatch('safe integer'));
exports.finiteNumberValue = exports.numberValue.test(Number.isFinite, error_1.DecodeError.expectedMatch('finite number'));
exports.booleanValue = exports.testType('boolean');
exports.undefinedValue = exports.testType('undefined');
exports.nullValue = exports.testValue(function (v) { return v === null; }, 'null').withResult(null);
exports.literalValue = function (value, eq) {
    if (eq === void 0) { eq = function (a, b) { return a === b; }; }
    return exports.testValue(function (v) { return eq(v, value); }, String(value)).withResult(value);
};
exports.anyArrayValue = exports.testValue(Array.isArray, 'array');
exports.arrayValue = function (decoder) {
    return exports.anyArrayValue.flatMap(function (values) {
        return make(function (input) {
            var length = values.length;
            var buff = new Array(length);
            for (var i = 0; i < length; i++) {
                var s = { input: values[i], path: input.path.concat([i]) };
                var r = decoder.run(s);
                if (r.isSuccess()) {
                    buff[i] = r.value;
                }
                else {
                    return result_1.DecodeResult.failure(r.input, r.failure);
                }
            }
            return result_1.DecodeResult.success(input, buff);
        });
    });
};
exports.tupleValue = function () {
    var decoders = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        decoders[_i] = arguments[_i];
    }
    return exports.anyArrayValue.flatMap(function (values) {
        return make(function (input) {
            var length = values.length;
            var buff = new Array(length);
            for (var i = 0; i < length; i++) {
                var s = { input: values[i], path: input.path.concat([i]) };
                var r = decoders[i].run(s);
                if (r.isSuccess()) {
                    buff[i] = r.value;
                }
                else {
                    return result_1.DecodeResult.failure(r.input, r.failure);
                }
            }
            return result_1.DecodeResult.success(input, buff);
        });
    });
};
var testObject = exports.testType('object');
exports.objectValue = function (fieldDecoders, optionalFields) {
    return testObject.flatMap(function (o) {
        return make(function (input) {
            var mandatoryFields = Object.keys(fieldDecoders).filter(function (f) { return optionalFields.indexOf(f) < 0; });
            var buff = {};
            for (var _i = 0, mandatoryFields_1 = mandatoryFields; _i < mandatoryFields_1.length; _i++) {
                var field = mandatoryFields_1[_i];
                if (o.hasOwnProperty(field)) {
                    var s = { input: o[field], path: input.path.concat([field]) };
                    var result = fieldDecoders[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return result_1.DecodeResult.failure(result.input, result.failure);
                    }
                }
                else {
                    return result_1.DecodeResult.failure(input, error_1.DecodeError.expectedField(field));
                }
            }
            for (var _a = 0, optionalFields_1 = optionalFields; _a < optionalFields_1.length; _a++) {
                var field = optionalFields_1[_a];
                if (o.hasOwnProperty(field)) {
                    var s = { input: o[field], path: input.path.concat([field]) };
                    var result = fieldDecoders[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return result_1.DecodeResult.failure(result.input, result.failure);
                    }
                }
            }
            return result_1.DecodeResult.success(input, buff);
        });
    });
};
var isToken = /^[a-z$_]+$/i;
exports.pathToString = function (path) {
    return path.reduce(function (acc, curr) {
        if (typeof curr === 'number') {
            return acc + "[" + curr + "]";
        }
        else if (isToken.test(curr)) {
            return acc.length === 0 ? curr : acc + "." + curr;
        }
        else {
            var t = curr.replace('"', '\\"');
            return acc + "[\"" + t + "\"]";
        }
    }, '');
};
exports.failureToString = function (err) {
    var failure = err.failure, input = err.input;
    var msg = failure.toString() + ' but got ' + String(input.input);
    var path = exports.pathToString(input.path);
    if (path === '')
        return msg;
    else
        return msg + " at " + path;
};
//# sourceMappingURL=index.js.map