"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("./parser");
var parse_result_1 = require("./parse_result");
var make = function (f) {
    return new parser_1.Parser(f);
};
exports.parse = function (parser, source) {
    return parser.run({ source: source, index: 0 });
};
exports.regexp = function (pattern, group) {
    if (group === void 0) { group = 0; }
    return make(function (source) {
        var s = source.source.substring(source.index);
        pattern.lastIndex = 0;
        var res = pattern.exec(s);
        if (res == null) {
            return new parse_result_1.ParseFailure(source, pattern.toString());
        }
        else {
            var index_1 = source.index + (pattern.global ? pattern.lastIndex : res[0].length);
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: index_1 }), res[group]);
        }
    });
};
exports.index = function () {
    return make(function (source) { return new parse_result_1.ParseSuccess(source, source.index); });
};
exports.rest = function () {
    return make(function (source) {
        var value = source.source.substring(source.index);
        return new parse_result_1.ParseSuccess(__assign({}, source, { index: source.source.length }), value);
    });
};
exports.eot = function () {
    return make(function (source) {
        var index = source.source.length;
        if (source.index === index) {
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), undefined);
        }
        else {
            return new parse_result_1.ParseFailure(source, 'EOT');
        }
    });
};
exports.match = function (s) {
    var length = s.length;
    return make(function (source) {
        var index = source.index + length;
        var value = source.source.substring(source.index, index);
        if (value === s) {
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), s);
        }
        else {
            return new parse_result_1.ParseFailure(source, "\"" + s + "\"");
        }
    });
};
exports.letter = function () {
    return exports.regexp(/^[a-z]/i).as('one letter');
};
exports.letters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " letter(s)" : "between " + min + " and " + max + " letter(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(new RegExp("^[a-z]{" + min + "," + maxs + "}", 'i')).as(message);
};
exports.digit = function () {
    return exports.regexp(/^\d/).as('one digit');
};
exports.digits = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " digit(s)" : "between " + min + " and " + max + " digit(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(new RegExp("^[0-9]{" + min + "," + maxs + "}", '')).as(message);
};
exports.whitespace = function () {
    return exports.regexp(/^\s+/).as('whitespace');
};
exports.optionalWhitespace = function () {
    return exports.regexp(/^\s*/).as('optional whitespace');
};
exports.char = function () {
    return make(function (source) {
        if (source.index < source.source.length) {
            var c = source.source.charAt(source.index);
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: source.index + 1 }), c);
        }
        else {
            // no more characters
            return new parse_result_1.ParseFailure(source, 'a character');
        }
    });
};
exports.testChar = function (f) {
    return make(function (source) {
        if (source.index >= source.source.length) {
            return new parse_result_1.ParseFailure(source, 'to test char but reached end of source');
        }
        else {
            var char_1 = source.source.charAt(source.index);
            if (f(char_1)) {
                return new parse_result_1.ParseSuccess(__assign({}, source, { index: source.index + 1 }), char_1);
            }
            else {
                return new parse_result_1.ParseFailure(source, 'failed matching char predicate');
            }
        }
    });
};
exports.matchOneOf = function (anyOf) {
    return exports.testChar(function (c) { return anyOf.indexOf(c) >= 0; }).as("expected one of `" + anyOf + "`");
};
exports.matchNoneOf = function (noneOf) {
    return exports.testChar(function (c) { return noneOf.indexOf(c) < 0; }).as("expected none of `" + noneOf + "`");
};
exports.takeWhile = function (f, atLeast) {
    if (atLeast === void 0) { atLeast = 1; }
    return make(function (source) {
        var index = source.index;
        while (index < source.source.length && f(source.source.charAt(index))) {
            index++;
        }
        if (index - source.index < atLeast) {
            return new parse_result_1.ParseFailure(source, "expected at least " + atLeast + " occurrance(s) of predicate");
        }
        else {
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), source.source.substring(source.index, index));
        }
    });
};
exports.takeBetween = function (f, min, max) {
    return make(function (source) {
        var index = source.index;
        var counter = 0;
        while (index < source.source.length && counter < max && f(source.source.charAt(index))) {
            index++;
            counter++;
        }
        if (counter < min) {
            return new parse_result_1.ParseFailure(source, "expected at least " + min + " occurrance(s) of predicate");
        }
        else {
            return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), source.source.substring(source.index, index));
        }
    });
};
//# sourceMappingURL=text_parser.js.map