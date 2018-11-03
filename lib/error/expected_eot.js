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
var ExpectedEOI = /** @class */ (function (_super) {
    __extends(ExpectedEOI, _super);
    function ExpectedEOI() {
        var _this = _super.call(this) || this;
        _this.kind = 'expected-eot-error';
        return _this;
    }
    ExpectedEOI.prototype.toString = function () {
        return "expected end of input";
    };
    return ExpectedEOI;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedEOI = ExpectedEOI;
//# sourceMappingURL=expected_eot.js.map