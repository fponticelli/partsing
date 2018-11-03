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
var ExpectedEoi = /** @class */ (function (_super) {
    __extends(ExpectedEoi, _super);
    function ExpectedEoi() {
        var _this = _super.call(this) || this;
        _this.kind = 'expected-eot';
        return _this;
    }
    ExpectedEoi.prototype.toString = function () {
        return "expected end of input";
    };
    return ExpectedEoi;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedEoi = ExpectedEoi;
//# sourceMappingURL=expected_eoi.js.map