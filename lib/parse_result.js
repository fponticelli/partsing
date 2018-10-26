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
var ParseResultBase = /** @class */ (function () {
    function ParseResultBase(source) {
        this.source = source;
    }
    return ParseResultBase;
}());
var ParseSuccess = /** @class */ (function (_super) {
    __extends(ParseSuccess, _super);
    function ParseSuccess(source, value) {
        var _this = _super.call(this, source) || this;
        _this.value = value;
        _this.kind = 'parse-success';
        return _this;
    }
    ParseSuccess.prototype.match = function (o) {
        return o.success(this);
    };
    ParseSuccess.prototype.flatMap = function (f) {
        return f(this.value);
    };
    ParseSuccess.prototype.map = function (f) {
        var _this = this;
        return this.flatMap(function (v) { return new ParseSuccess(_this.source, f(v)); });
    };
    ParseSuccess.prototype.flatMapError = function (f) {
        return new ParseSuccess(this.source, this.value);
    };
    ParseSuccess.prototype.mapError = function (f) {
        return new ParseSuccess(this.source, this.value);
    };
    ParseSuccess.prototype.isSuccess = function () {
        return true;
    };
    ParseSuccess.prototype.isFailure = function () {
        return false;
    };
    ParseSuccess.prototype.getUnsafeSuccess = function () {
        return this.value;
    };
    ParseSuccess.prototype.getUnsafeFailure = function () {
        throw new Error('can\'t get failure from success');
    };
    ParseSuccess.prototype.toString = function () {
        return "ParseSuccess<" + JSON.stringify(this.value) + ">: " + JSON.stringify(this.source);
    };
    return ParseSuccess;
}(ParseResultBase));
exports.ParseSuccess = ParseSuccess;
var ParseFailure = /** @class */ (function (_super) {
    __extends(ParseFailure, _super);
    function ParseFailure(source, failure) {
        var _this = _super.call(this, source) || this;
        _this.failure = failure;
        _this.kind = 'parse-failure';
        return _this;
    }
    ParseFailure.prototype.match = function (o) {
        return o.failure(this);
    };
    ParseFailure.prototype.flatMap = function (f) {
        return new ParseFailure(this.source, this.failure);
    };
    ParseFailure.prototype.map = function (f) {
        return new ParseFailure(this.source, this.failure);
    };
    ParseFailure.prototype.flatMapError = function (f) {
        return f(this.failure);
    };
    ParseFailure.prototype.mapError = function (f) {
        var _this = this;
        return this.flatMapError(function (e) { return new ParseFailure(_this.source, f(e)); });
    };
    ParseFailure.prototype.isSuccess = function () {
        return false;
    };
    ParseFailure.prototype.isFailure = function () {
        return true;
    };
    ParseFailure.prototype.getUnsafeSuccess = function () {
        throw new Error('can\'t get success from failure');
    };
    ParseFailure.prototype.getUnsafeFailure = function () {
        return this.failure;
    };
    ParseFailure.prototype.toString = function () {
        return "ParseFailure<" + JSON.stringify(this.failure) + ">: " + JSON.stringify(this.source);
    };
    return ParseFailure;
}(ParseResultBase));
exports.ParseFailure = ParseFailure;
exports.ParseResult = {
    success: function (source, result) {
        return new ParseSuccess(source, result);
    },
    failure: function (source, failure) {
        return new ParseFailure(source, failure);
    }
};
//# sourceMappingURL=parse_result.js.map