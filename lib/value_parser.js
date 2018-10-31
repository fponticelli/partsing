"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("./parser");
var parse_result_1 = require("./parse_result");
var make = function (f) {
    return new parser_1.Parser(f);
};
exports.parseValue = function (parser, source) {
    return parser.run({ source: source, path: [] });
};
exports.testValue = function (f, expected) { return make(function (source) {
    return f(source.source) ?
        parse_result_1.ParseResult.success(source, source.source) :
        parse_result_1.ParseResult.failure(source, "expected " + expected + " but got " + source.source);
}); };
exports.testType = function (expected) { return make(function (source) {
    return typeof source.source === expected ?
        parse_result_1.ParseResult.success(source, source.source) :
        parse_result_1.ParseResult.failure(source, "expected " + expected + " but got " + typeof source.source);
}); };
exports.nullableValue = function (parser) { return parser.or(exports.nullValue); };
exports.undefineableValue = function (parser) { return parser.or(exports.undefinedValue); };
exports.optionalValue = function (parser) { return parser.or(exports.undefinedValue).or(exports.nullValue); };
exports.anyValue = make(function (source) { return parse_result_1.ParseResult.success(source, source.source); });
exports.stringValue = exports.testType('string');
exports.numberValue = exports.testType('number');
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
        return make(function (source) {
            var length = values.length;
            var buff = new Array(length);
            for (var i = 0; i < length; i++) {
                var s = { source: values[i], path: source.path.concat([i]) };
                var r = parser.run(s);
                if (r.isSuccess()) {
                    buff[i] = r.value;
                }
                else {
                    return parse_result_1.ParseResult.failure(r.source, r.failure);
                }
            }
            return parse_result_1.ParseResult.success(source, buff);
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
        return make(function (source) {
            var mandatoryFields = Object.keys(fieldParsers).filter(function (f) { return optionalFields.indexOf(f) >= 0; });
            var buff = {};
            for (var _i = 0, mandatoryFields_1 = mandatoryFields; _i < mandatoryFields_1.length; _i++) {
                var field = mandatoryFields_1[_i];
                if (o.hasOwnProperty(field)) {
                    var s = { source: o[field], path: source.path.concat([field]) };
                    var result = fieldParsers[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return parse_result_1.ParseResult.failure(result.source, result.failure);
                    }
                }
                else {
                    return parse_result_1.ParseResult.failure(source, "object doesn't have mandatory field \"" + field + "\"");
                }
            }
            for (var _a = 0, optionalFields_1 = optionalFields; _a < optionalFields_1.length; _a++) {
                var field = optionalFields_1[_a];
                if (o.hasOwnProperty(field)) {
                    var s = { source: o[field], path: source.path.concat([field]) };
                    var result = fieldParsers[field].run(s);
                    if (result.isSuccess()) {
                        buff[field] = result.value;
                    }
                    else {
                        return parse_result_1.ParseResult.failure(result.source, result.failure);
                    }
                }
            }
            return parse_result_1.ParseResult.success(source, buff);
        });
    });
};
//# sourceMappingURL=value_parser.js.map