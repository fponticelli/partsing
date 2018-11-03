"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("../core/parser");
var result_1 = require("../core/result");
var make = function (f) {
    return new parser_1.Parser(f);
};
exports.parseValue = function (parser, input) {
    return parser.run({ input: input, path: [] });
};
exports.testValue = function (f, expected) { return make(function (input) {
    return f(input.input) ?
        result_1.ParseResult.success(input, input.input) :
        result_1.ParseResult.failure(input, "expected " + expected + " but got " + input.input);
}); };
exports.testType = function (expected) { return make(function (input) {
    return typeof input.input === expected ?
        result_1.ParseResult.success(input, input.input) :
        result_1.ParseResult.failure(input, "expected " + expected + " but got " + typeof input.input);
}); };
exports.nullableValue = function (parser) { return parser.or(exports.nullValue); };
exports.undefineableValue = function (parser) { return parser.or(exports.undefinedValue); };
exports.optionalValue = function (parser) { return parser.or(exports.undefinedValue).or(exports.nullValue); };
exports.anyValue = make(function (input) { return result_1.ParseResult.success(input, input.input); });
exports.stringValue = exports.testType('string');
exports.numberValue = exports.testType('number');
exports.integerValue = exports.numberValue.test(Number.isInteger, 'expected integer');
exports.safeIntegerValue = exports.numberValue.test(Number.isSafeInteger, 'expected safe integer');
exports.finiteNumberValue = exports.numberValue.test(Number.isFinite, 'expected finite number');
exports.booleanValue = exports.testType('boolean');
exports.undefinedValue = exports.testType('undefined');
exports.nullValue = exports.testValue(function (v) { return v === null; }, 'null').withResult(null);
exports.literalValue = function (value, eq) {
    if (eq === void 0) { eq = function (a, b) { return a === b; }; }
    return exports.testValue(function (v) { return eq(v, value); }, String(value)).withResult(value);
};
exports.anyArrayValue = exports.testValue(Array.isArray, 'array');
exports.arrayValue = function (parser) {
    return exports.anyArrayValue.flatMap(function (values) {
        return make(function (input) {
            var length = values.length;
            var buff = new Array(length);
            for (var i = 0; i < length; i++) {
                var s = { input: values[i], path: input.path.concat([i]) };
                var r = parser.run(s);
                if (r.isSuccess()) {
                    buff[i] = r.value;
                }
                else {
                    return result_1.ParseResult.failure(r.input, r.failure);
                }
            }
            return result_1.ParseResult.success(input, buff);
        });
    });
};
exports.tupleValue = function () {
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    return exports.anyArrayValue.flatMap(function (values) {
        return make(function (input) {
            var length = values.length;
            var buff = new Array(length);
            for (var i = 0; i < length; i++) {
                var s = { input: values[i], path: input.path.concat([i]) };
                var r = parsers[i].run(s);
                if (r.isSuccess()) {
                    buff[i] = r.value;
                }
                else {
                    return result_1.ParseResult.failure(r.input, r.failure);
                }
            }
            return result_1.ParseResult.success(input, buff);
        });
    });
};
var testObject = exports.testType('object');
exports.objectValue = function (fieldParsers) {
    var optionalFields = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalFields[_i - 1] = arguments[_i];
    }
    return testObject.flatMap(function (o) {
        return make(function (input) {
            var mandatoryFields = Object.keys(fieldParsers).filter(function (f) { return optionalFields.indexOf(f) < 0; });
            var buff = {};
            for (var _i = 0, mandatoryFields_1 = mandatoryFields; _i < mandatoryFields_1.length; _i++) {
                var field = mandatoryFields_1[_i];
                if (o.hasOwnProperty(field)) {
                    var s = { input: o[field], path: input.path.concat([field]) };
                    var result = fieldParsers[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return result_1.ParseResult.failure(result.input, result.failure);
                    }
                }
                else {
                    return result_1.ParseResult.failure(input, "object doesn't have mandatory field \"" + field + "\"");
                }
            }
            for (var _a = 0, optionalFields_1 = optionalFields; _a < optionalFields_1.length; _a++) {
                var field = optionalFields_1[_a];
                if (o.hasOwnProperty(field)) {
                    var s = { input: o[field], path: input.path.concat([field]) };
                    var result = fieldParsers[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return result_1.ParseResult.failure(result.input, result.failure);
                    }
                }
            }
            return result_1.ParseResult.success(input, buff);
        });
    });
};
//# sourceMappingURL=index.js.map