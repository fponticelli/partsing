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
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     https://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var decode_error_base_1 = require("./decode_error_base");
var entity_1 = require("./entity");
var ExpectedAtLeast = /** @class */ (function (_super) {
    __extends(ExpectedAtLeast, _super);
    function ExpectedAtLeast(min, entity) {
        var _this = _super.call(this) || this;
        _this.min = min;
        _this.entity = entity;
        _this.kind = 'expected-at-least';
        return _this;
    }
    ExpectedAtLeast.prototype.toString = function () {
        return "expected at least " + this.min + " " + entity_1.pluralize(this.entity, this.min);
    };
    return ExpectedAtLeast;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedAtLeast = ExpectedAtLeast;
//# sourceMappingURL=expected_at_least.js.map