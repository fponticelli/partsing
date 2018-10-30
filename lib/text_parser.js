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
exports.parseText = function (parser, source) {
    return parser.run({ source: source, index: 0 });
};
exports.regexp = function (pattern, group) {
    if (group === void 0) { group = 0; }
    if (pattern.sticky) {
        return make(function (source) {
            pattern.lastIndex = source.index;
            var res = pattern.exec(source.source);
            if (res == null) {
                return new parse_result_1.ParseFailure(source, pattern.toString());
            }
            else {
                return new parse_result_1.ParseSuccess(__assign({}, source, { index: pattern.lastIndex }), res[group]);
            }
        });
    }
    else if (pattern.global) {
        return make(function (source) {
            var s = source.source.substring(source.index);
            pattern.lastIndex = 0;
            var res = pattern.exec(s);
            if (res == null) {
                return new parse_result_1.ParseFailure(source, pattern.toString());
            }
            else {
                var index = source.index + pattern.lastIndex;
                return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), res[group]);
            }
        });
    }
    else {
        return make(function (source) {
            var s = source.source.substring(source.index);
            pattern.lastIndex = 0;
            var res = pattern.exec(s);
            if (res == null) {
                return new parse_result_1.ParseFailure(source, pattern.toString());
            }
            else {
                var index = source.index + s.indexOf(res[0]) + res[0].length;
                return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), res[group]);
            }
        });
    }
};
exports.withPosition = make(function (source) { return new parse_result_1.ParseSuccess(source, source.index); });
exports.rest = make(function (source) {
    var value = source.source.substring(source.index);
    return new parse_result_1.ParseSuccess(__assign({}, source, { index: source.source.length }), value);
});
exports.eot = make(function (source) {
    var index = source.source.length;
    if (source.index === index) {
        return new parse_result_1.ParseSuccess(__assign({}, source, { index: index }), undefined);
    }
    else {
        return new parse_result_1.ParseFailure(source, 'EOT');
    }
});
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
var _a = (function () {
    var testSticky = (function () {
        try {
            return /test/y.sticky;
        }
        catch (_) {
            return false;
        }
    })();
    if (testSticky) {
        return {
            letterPattern: /[a-z]/yi,
            lettersPattern: function (min, max) { return new RegExp("[a-z]{" + min + "," + max + "}", 'yi'); },
            upperCaseLetterPattern: /[A-Z]/y,
            upperCaseLettersPattern: function (min, max) { return new RegExp("[A-Z]{" + min + "," + max + "}", 'y'); },
            lowerCaseLetterPattern: /[a-z]/y,
            lowerCaseLettersPattern: function (min, max) { return new RegExp("[a-z]{" + min + "," + max + "}", 'y'); },
            digitPattern: /\d/y,
            digitsPattern: function (min, max) { return new RegExp("[0-9]{" + min + "," + max + "}", 'yi'); },
            whitespacePattern: /\s+/y,
            optionalWhitespacePattern: /\s*/y
        };
    }
    else {
        return {
            letterPattern: /^[a-z]/i,
            lettersPattern: function (min, max) { return new RegExp("^[a-z]{" + min + "," + max + "}", 'i'); },
            upperCaseLetterPattern: /^[A-Z]/,
            upperCaseLettersPattern: function (min, max) { return new RegExp("^[A-Z]{" + min + "," + max + "}", ''); },
            lowerCaseLetterPattern: /^[a-z]/,
            lowerCaseLettersPattern: function (min, max) { return new RegExp("^[a-z]{" + min + "," + max + "}", ''); },
            digitPattern: /^\d/,
            digitsPattern: function (min, max) { return new RegExp("^[0-9]{" + min + "," + max + "}", 'i'); },
            whitespacePattern: /^\s+/,
            optionalWhitespacePattern: /^\s*/
        };
    }
})(), letterPattern = _a.letterPattern, lettersPattern = _a.lettersPattern, upperCaseLetterPattern = _a.upperCaseLetterPattern, upperCaseLettersPattern = _a.upperCaseLettersPattern, lowerCaseLetterPattern = _a.lowerCaseLetterPattern, lowerCaseLettersPattern = _a.lowerCaseLettersPattern, digitPattern = _a.digitPattern, digitsPattern = _a.digitsPattern, whitespacePattern = _a.whitespacePattern, optionalWhitespacePattern = _a.optionalWhitespacePattern;
exports.letter = exports.regexp(letterPattern).withFailure('one letter');
exports.letters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " letter(s)" : "between " + min + " and " + max + " letter(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(lettersPattern(String(min), maxs)).withFailure(message);
};
exports.upperCaseLetter = exports.regexp(upperCaseLetterPattern).withFailure('one letter');
exports.upperCaseLetters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " letter(s)" : "between " + min + " and " + max + " letter(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message);
};
exports.lowerCaseLetter = exports.regexp(lowerCaseLetterPattern).withFailure('one letter');
exports.lowerCaseLetters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " letter(s)" : "between " + min + " and " + max + " letter(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message);
};
exports.digit = exports.regexp(digitPattern).withFailure('one digit');
exports.digits = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = max === undefined ? "at least " + min + " digit(s)" : "between " + min + " and " + max + " digit(s)";
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(digitsPattern(String(min), maxs)).withFailure(message);
};
exports.whitespace = exports.regexp(whitespacePattern).withFailure('whitespace');
exports.optionalWhitespace = exports.regexp(optionalWhitespacePattern).withFailure('optional whitespace');
exports.char = make(function (source) {
    if (source.index < source.source.length) {
        var c = source.source.charAt(source.index);
        return new parse_result_1.ParseSuccess(__assign({}, source, { index: source.index + 1 }), c);
    }
    else {
        // no more characters
        return new parse_result_1.ParseFailure(source, 'a character');
    }
});
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
exports.matchAnyCharOf = function (anyOf) {
    return exports.testChar(function (c) { return anyOf.indexOf(c) >= 0; }).withFailure("expected any char of `" + anyOf + "`");
};
exports.matchNoCharOf = function (noneOf) {
    return exports.testChar(function (c) { return noneOf.indexOf(c) < 0; }).withFailure("expected none of `" + noneOf + "` chars");
};
exports.takeCharWhile = function (f, atLeast) {
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
exports.takeCharBetween = function (f, min, max) {
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