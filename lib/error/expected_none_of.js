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
var decode_error_base_1 = require("./decode_error_base");
var entity_1 = require("./entity");
var expected_any_of_1 = require("./expected_any_of");
var ExpectedNoneOf = /** @class */ (function (_super) {
    __extends(ExpectedNoneOf, _super);
    function ExpectedNoneOf(entity, values) {
        var _this = _super.call(this) || this;
        _this.entity = entity;
        _this.values = values;
        _this.kind = 'no-char-of-error';
        return _this;
    }
    ExpectedNoneOf.prototype.toString = function () {
        return "expected no " + entity_1.pluralize(this.entity, 1) + " like " + expected_any_of_1.concatOr(this.values);
    };
    return ExpectedNoneOf;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedNoneOf = ExpectedNoneOf;
//# sourceMappingURL=expected_none_of.js.map