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
var Entity_1 = require("./Entity");
exports.concatOr = function (values) {
    return [values.slice(0, values.length - 1).join(', ')]
        .concat(values.slice(values.length - 1)).join(' or ');
};
var ExpectedAnyOf = /** @class */ (function (_super) {
    __extends(ExpectedAnyOf, _super);
    function ExpectedAnyOf(entity, values) {
        var _this = _super.call(this) || this;
        _this.entity = entity;
        _this.values = values;
        _this.kind = 'expected-any-of';
        return _this;
    }
    ExpectedAnyOf.prototype.toString = function () {
        return "expected any " + Entity_1.pluralize(this.entity, 1) + " in " + exports.concatOr(this.values);
    };
    return ExpectedAnyOf;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedAnyOf = ExpectedAnyOf;
//# sourceMappingURL=expected_any_of.js.map