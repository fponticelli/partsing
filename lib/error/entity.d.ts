export declare enum Entity {
    CHARACTER = "character",
    PREDICATE = "predicate",
    LETTER = "letter",
    UPPERCASE_LETTER = "uppercase letter",
    LOWER_CASE_LETTER = "lowercase letter",
    DIGIT = "digit",
    WHITESPACE = "whitespace"
}
export declare const pluralize: (entity: Entity, qt: number) => string;
