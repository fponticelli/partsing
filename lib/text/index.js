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
var parser_1 = require("../core/parser");
var result_1 = require("../core/result");
var error_1 = require("../error");
var error_2 = require("../error");
var make = function (f) {
    return new parser_1.Parser(f);
};
exports.parseText = function (parser, input) {
    return parser.run({ input: input, index: 0 });
};
exports.regexp = function (pattern, group) {
    if (group === void 0) { group = 0; }
    if (pattern.sticky) {
        return make(function (input) {
            pattern.lastIndex = input.index;
            var res = pattern.exec(input.input);
            if (res == null) {
                return new result_1.ParseFailure(input, error_1.DecodeError.patternMismatch(pattern.source));
            }
            else {
                return new result_1.ParseSuccess(__assign({}, input, { index: pattern.lastIndex }), res[group]);
            }
        });
    }
    else if (pattern.global) {
        return make(function (input) {
            var s = input.input.substring(input.index);
            pattern.lastIndex = 0;
            var res = pattern.exec(s);
            if (res == null) {
                return new result_1.ParseFailure(input, error_1.DecodeError.patternMismatch(pattern.source));
            }
            else {
                var index = input.index + pattern.lastIndex;
                return new result_1.ParseSuccess(__assign({}, input, { index: index }), res[group]);
            }
        });
    }
    else {
        return make(function (input) {
            var s = input.input.substring(input.index);
            pattern.lastIndex = 0;
            var res = pattern.exec(s);
            if (res == null) {
                return new result_1.ParseFailure(input, error_1.DecodeError.patternMismatch(pattern.source));
            }
            else {
                var index = input.index + s.indexOf(res[0]) + res[0].length;
                return new result_1.ParseSuccess(__assign({}, input, { index: index }), res[group]);
            }
        });
    }
};
exports.withPosition = make(function (input) { return new result_1.ParseSuccess(input, input.index); });
exports.rest = make(function (input) {
    var value = input.input.substring(input.index);
    return new result_1.ParseSuccess(__assign({}, input, { index: input.input.length }), value);
});
exports.eot = make(function (input) {
    var index = input.input.length;
    if (input.index === index) {
        return new result_1.ParseSuccess(__assign({}, input, { index: index }), undefined);
    }
    else {
        return new result_1.ParseFailure(input, error_1.DecodeError.expectedEot);
    }
});
exports.match = function (s) {
    var length = s.length;
    return make(function (input) {
        var index = input.index + length;
        var value = input.input.substring(input.index, index);
        if (value === s) {
            return new result_1.ParseSuccess(__assign({}, input, { index: index }), s);
        }
        else {
            return new result_1.ParseFailure(input, error_1.DecodeError.expectedMatch(s));
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
exports.letter = exports.regexp(letterPattern).withFailure(error_1.DecodeError.expectedOnce(error_2.Entity.LETTER));
exports.letters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = error_1.DecodeError.expectedAtLeast(min, error_2.Entity.LETTER);
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(lettersPattern(String(min), maxs)).withFailure(message);
};
exports.upperCaseLetter = exports.regexp(upperCaseLetterPattern)
    .withFailure(error_1.DecodeError.expectedOnce(error_2.Entity.UPPER_CASE_LETTER));
exports.upperCaseLetters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = error_1.DecodeError.expectedAtLeast(min, error_2.Entity.UPPER_CASE_LETTER);
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message);
};
exports.lowerCaseLetter = exports.regexp(lowerCaseLetterPattern)
    .withFailure(error_1.DecodeError.expectedOnce(error_2.Entity.LOWER_CASE_LETTER));
exports.lowerCaseLetters = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = error_1.DecodeError.expectedAtLeast(min, error_2.Entity.LOWER_CASE_LETTER);
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message);
};
exports.digit = exports.regexp(digitPattern).withFailure(error_1.DecodeError.expectedOnce(error_2.Entity.DIGIT));
exports.digits = function (min, max) {
    if (min === void 0) { min = 1; }
    var message = error_1.DecodeError.expectedAtLeast(min, error_2.Entity.DIGIT);
    var maxs = max === undefined ? '' : String(max);
    return exports.regexp(digitsPattern(String(min), maxs)).withFailure(message);
};
exports.whitespace = exports.regexp(whitespacePattern)
    .withFailure(error_1.DecodeError.expectedAtLeast(1, error_2.Entity.WHITESPACE));
exports.optionalWhitespace = exports.regexp(optionalWhitespacePattern);
exports.char = make(function (input) {
    if (input.index < input.input.length) {
        var c = input.input.charAt(input.index);
        return new result_1.ParseSuccess(__assign({}, input, { index: input.index + 1 }), c);
    }
    else {
        // no more characters
        return new result_1.ParseFailure(input, error_1.DecodeError.expectedOnce(error_2.Entity.CHARACTER));
    }
});
exports.testChar = function (f) {
    return make(function (input) {
        if (input.index >= input.input.length) {
            return new result_1.ParseFailure(input, error_1.DecodeError.unexpectedEoi);
        }
        else {
            var char_1 = input.input.charAt(input.index);
            if (f(char_1)) {
                return new result_1.ParseSuccess(__assign({}, input, { index: input.index + 1 }), char_1);
            }
            else {
                return new result_1.ParseFailure(input, error_1.DecodeError.expectedOnce(error_2.Entity.PREDICATE));
            }
        }
    });
};
exports.matchAnyCharOf = function (anyOf) {
    return exports.testChar(function (c) { return anyOf.indexOf(c) >= 0; }).withFailure(error_1.DecodeError.expectedAnyOf(error_2.Entity.CHARACTER, anyOf.split('').map(function (v) { return "\"" + v + "\""; })));
};
exports.matchNoCharOf = function (noneOf) {
    return exports.testChar(function (c) { return noneOf.indexOf(c) < 0; }).withFailure(error_1.DecodeError.expectedNoneOf(error_2.Entity.CHARACTER, noneOf.split('').map(function (v) { return "\"" + v + "\""; })));
};
exports.takeCharWhile = function (f, atLeast) {
    if (atLeast === void 0) { atLeast = 1; }
    return make(function (input) {
        var index = input.index;
        while (index < input.input.length && f(input.input.charAt(index))) {
            index++;
        }
        if (index - input.index < atLeast) {
            return new result_1.ParseFailure(input, error_1.DecodeError.expectedAtLeast(atLeast, error_2.Entity.PREDICATE));
        }
        else {
            return new result_1.ParseSuccess(__assign({}, input, { index: index }), input.input.substring(input.index, index));
        }
    });
};
exports.takeCharBetween = function (f, min, max) {
    return make(function (input) {
        var index = input.index;
        var counter = 0;
        while (index < input.input.length && counter < max && f(input.input.charAt(index))) {
            index++;
            counter++;
        }
        if (counter < min) {
            return new result_1.ParseFailure(input, error_1.DecodeError.expectedAtLeast(min, error_2.Entity.PREDICATE));
        }
        else {
            return new result_1.ParseSuccess(__assign({}, input, { index: index }), input.input.substring(input.index, index));
        }
    });
};
//# sourceMappingURL=index.js.map