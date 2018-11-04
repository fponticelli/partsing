"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var custom_error_1 = require("./custom_error");
var expected_any_of_1 = require("./expected_any_of");
var expected_at_least_1 = require("./expected_at_least");
var expected_eoi_1 = require("./expected_eoi");
var expected_field_1 = require("./expected_field");
var expected_match_1 = require("./expected_match");
var expected_none_of_1 = require("./expected_none_of");
var expected_once_1 = require("./expected_once");
var expected_within_range_1 = require("./expected_within_range");
var pattern_mismatch_1 = require("./pattern_mismatch");
var unexpected_eoi_1 = require("./unexpected_eoi");
exports.DecodeError = {
    custom: function (value) { return new custom_error_1.CustomError(value); },
    expectedAnyOf: function (entity, values) { return new expected_any_of_1.ExpectedAnyOf(entity, values); },
    expectedAtLeast: function (min, entity) { return new expected_at_least_1.ExpectedAtLeast(min, entity); },
    expectedEot: new expected_eoi_1.ExpectedEoi(),
    expectedField: function (field) { return new expected_field_1.ExpectedField(field); },
    expectedMatch: function (value) { return new expected_match_1.ExpectedMatch(value); },
    expectedNoneOf: function (entity, values) { return new expected_none_of_1.ExpectedNoneOf(entity, values); },
    expectedOnce: function (entity) { return new expected_once_1.ExpectedOnce(entity); },
    expectedWithinRange: function (min, max) { return new expected_within_range_1.ExpectedWithinRange(min, max); },
    patternMismatch: function (pattern) { return new pattern_mismatch_1.PatternMismatch(pattern); },
    unexpectedEoi: new unexpected_eoi_1.UnexpectedEoi()
};
var entity_1 = require("./entity");
exports.Entity = entity_1.Entity;
exports.pluralize = entity_1.pluralize;
var custom_error_2 = require("./custom_error");
exports.CustomError = custom_error_2.CustomError;
var expected_any_of_2 = require("./expected_any_of");
exports.ExpectedAnyOf = expected_any_of_2.ExpectedAnyOf;
exports.concatOr = expected_any_of_2.concatOr;
var expected_at_least_2 = require("./expected_at_least");
exports.ExpectedAtLeast = expected_at_least_2.ExpectedAtLeast;
var expected_eoi_2 = require("./expected_eoi");
exports.ExpectedEoi = expected_eoi_2.ExpectedEoi;
var expected_field_2 = require("./expected_field");
exports.ExpectedField = expected_field_2.ExpectedField;
var expected_match_2 = require("./expected_match");
exports.ExpectedMatch = expected_match_2.ExpectedMatch;
var expected_none_of_2 = require("./expected_none_of");
exports.ExpectedNoneOf = expected_none_of_2.ExpectedNoneOf;
var expected_once_2 = require("./expected_once");
exports.ExpectedOnce = expected_once_2.ExpectedOnce;
var expected_within_range_2 = require("./expected_within_range");
exports.ExpectedWithinRange = expected_within_range_2.ExpectedWithinRange;
var pattern_mismatch_2 = require("./pattern_mismatch");
exports.PatternMismatch = pattern_mismatch_2.PatternMismatch;
var unexpected_eoi_2 = require("./unexpected_eoi");
exports.UnexpectedEoi = unexpected_eoi_2.UnexpectedEoi;
//# sourceMappingURL=index.js.map