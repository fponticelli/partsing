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
var ExpectedAtLeast = /** @class */ (function (_super) {
    __extends(ExpectedAtLeast, _super);
    function ExpectedAtLeast(min, entity) {
        var _this = _super.call(this) || this;
        _this.min = min;
        _this.entity = entity;
        _this.kind = 'expected-at-least-error';
        return _this;
    }
    ExpectedAtLeast.prototype.toString = function () {
        return "expected at least " + this.min + " " + Entity_1.pluralize(this.entity, this.min);
    };
    return ExpectedAtLeast;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedAtLeast = ExpectedAtLeast;
//# sourceMappingURL=expected_at_least.js.map