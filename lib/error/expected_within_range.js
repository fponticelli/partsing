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
var ExpectedWithinRange = /** @class */ (function (_super) {
    __extends(ExpectedWithinRange, _super);
    function ExpectedWithinRange(min, max) {
        var _this = _super.call(this) || this;
        _this.min = min;
        _this.max = max;
        _this.kind = 'expected-within-range';
        return _this;
    }
    ExpectedWithinRange.prototype.toString = function () {
        return "expected between " + this.min + " and " + this.max;
    };
    return ExpectedWithinRange;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedWithinRange = ExpectedWithinRange;
//# sourceMappingURL=expected_within_range.js.map