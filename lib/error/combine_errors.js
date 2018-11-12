"use strict";
// Copyright 2018 Google LLC
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
var CombineErrors = /** @class */ (function (_super) {
    __extends(CombineErrors, _super);
    function CombineErrors(errors) {
        var _this = _super.call(this) || this;
        _this.errors = errors;
        _this.kind = 'combine-errors';
        return _this;
    }
    CombineErrors.prototype.toString = function () {
        var errors = this.errors
            .map(function (e) { return e.toString(); })
            .map(function (s) { return "  - " + s; })
            .join('\n');
        return "expected one of:\n" + errors;
    };
    return CombineErrors;
}(decode_error_base_1.DecodeErrorBase));
exports.CombineErrors = CombineErrors;
//# sourceMappingURL=combine_errors.js.map