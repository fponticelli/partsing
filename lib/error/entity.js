"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Entity;
(function (Entity) {
    Entity["CHARACTER"] = "character";
    Entity["PREDICATE"] = "predicate";
    Entity["LETTER"] = "letter";
    Entity["UPPER_CASE_LETTER"] = "uppercase letter";
    Entity["LOWER_CASE_LETTER"] = "lowercase letter";
    Entity["DIGIT"] = "digit";
    Entity["WHITESPACE"] = "whitespace";
})(Entity = exports.Entity || (exports.Entity = {}));
exports.pluralize = function (entity, qt) {
    if (qt === 1)
        return String(entity);
    switch (entity) {
        case Entity.CHARACTER: return 'characters';
        case Entity.PREDICATE: return 'predicates';
        case Entity.LETTER: return 'letters';
        case Entity.UPPER_CASE_LETTER: return 'uppercase letters';
        case Entity.LOWER_CASE_LETTER: return 'lowercase letters';
        case Entity.DIGIT: return 'digits';
        case Entity.WHITESPACE: return 'whitespaces';
        default: throw new Error('unreacheable code');
    }
};
//# sourceMappingURL=entity.js.map