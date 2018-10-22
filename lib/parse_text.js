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
var parse_1 = require("./parse");
var make = function (f) { return new parse_1.Parser(f); };
exports.expect = function (expected, parser) {
    return make(function (source) { return parser.run(source).mapError(function (f) { return (__assign({}, f, { expected: expected })); }); });
};
exports.parse = function (parser, source) {
    return parser.run({ source: source, index: 0 });
};
exports.regexp = function (pattern, group) {
    if (group === void 0) { group = 0; }
    return make(function (source) {
        var res = pattern.exec(source.source.substring(source.index));
        if (res == null) {
            return new parse_1.ParseFailure(source, { expected: pattern.toString() });
        }
        else {
            var index_1 = source.index + pattern.lastIndex;
            return new parse_1.ParseSuccess(__assign({}, source, { index: index_1 }), res[group]);
        }
    });
};
exports.index = function () {
    return make(function (source) { return new parse_1.ParseSuccess(source, source.index); });
};
exports.rest = function () {
    return make(function (source) {
        var value = source.source.substring(source.index);
        return new parse_1.ParseSuccess(__assign({}, source, { index: source.source.length }), value);
    });
};
exports.eot = function () {
    return make(function (source) {
        var index = source.source.length;
        if (source.index === index) {
            return new parse_1.ParseSuccess(__assign({}, source, { index: index }), undefined);
        }
        else {
            return new parse_1.ParseFailure(source, { expected: 'EOT' });
        }
    });
};
exports.match = function (s) {
    var length = s.length;
    return make(function (source) {
        var index = source.index + length;
        var value = source.source.substring(source.index, index);
        if (value === s) {
            return new parse_1.ParseSuccess(__assign({}, source, { index: index }), s);
        }
        else {
            return new parse_1.ParseFailure(source, { expected: s });
        }
    });
};
exports.lazy = function (f) {
    var parser;
    return make(function (source) {
        if (parser === undefined)
            parser = f();
        return parser.run(source);
    });
};
exports.letter = function () {
    return exports.expect('one letter', exports.regexp(/~[a-z]/gi));
};
exports.letters = function (min, max) {
    var message = max === undefined ? "at least " + min + " letters" : "between " + min + " and " + max + " letters";
    var maxs = max === undefined ? '' : String(max);
    return exports.expect(message, exports.regexp(new RegExp("~[a-z]{" + min + "," + maxs + "}", 'gi')));
};
exports.digit = function () {
    return exports.expect('one digit', exports.regexp(/~\d/gi));
};
exports.digits = function (min, max) {
    var message = max === undefined ? "at least " + min + " digits" : "between " + min + " and " + max + " digits";
    var maxs = max === undefined ? '' : String(max);
    return exports.expect(message, exports.regexp(new RegExp("~d{" + min + "," + maxs + "}", 'gi')));
};
exports.whitespace = function () {
    return exports.expect('whitespace', exports.regexp(/\s+/g));
};
exports.optionalWhitespace = function () {
    return exports.expect('optional whitespace', exports.regexp(/\s*/g));
};
exports.char = function () {
    return make(function (source) {
        if (source.index < source.source.length) {
            var c = source.source.charAt(source.index);
            return new parse_1.ParseSuccess(__assign({}, source, { index: source.index + 1 }), c);
        }
        else {
            // no more characters
            return new parse_1.ParseFailure(source, { expected: 'a character' });
        }
    });
};
exports.testChar = function (f) {
    return make(function (source) {
        if (source.index < source.source.length) {
            return new parse_1.ParseFailure(source, { expected: 'expected to test char but reached end of source' });
        }
        else {
            var char_1 = source.source.charAt(source.index);
            if (f(char_1)) {
                return new parse_1.ParseSuccess(__assign({}, source, { index: source.index + 1 }), char_1);
            }
            else {
                return new parse_1.ParseFailure(source, { expected: 'failed matching char predicate' });
            }
        }
    });
};
exports.matchOneOf = function (anyOf) {
    return exports.testChar(function (c) { return anyOf.indexOf(c) >= 0; });
};
exports.matchNoneOf = function (noneOf) {
    return exports.testChar(function (c) { return noneOf.indexOf(c) < 0; });
};
exports.takeWhile = function (f, atLeast) {
    if (atLeast === void 0) { atLeast = 1; }
    return make(function (source) {
        var index = source.index;
        while (index < source.source.length && f(source.source.charAt(index))) {
            index++;
        }
        if (index - source.index < atLeast) {
            return new parse_1.ParseFailure(source, { expected: "expected at least " + atLeast + " occurrances of predicate" });
        }
        else {
            return new parse_1.ParseSuccess(__assign({}, source, { index: index }), source.source.substring(source.index, index));
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
            return new parse_1.ParseFailure(source, { expected: "expected at least " + counter + " occurrances of predicate" });
        }
        else {
            return new parse_1.ParseSuccess(__assign({}, source, { index: index }), source.source.substring(source.index, index));
        }
    });
};
//# sourceMappingURL=parse_text.js.map