export enum Entity {
  CHARACTER = 'character',
  PREDICATE = 'predicate',
  LETTER = 'letter',
  UPPERCASE_LETTER = 'uppercase letter',
  LOWER_CASE_LETTER = 'lowercase letter',
  DIGIT = 'digit',
  WHITESPACE = 'whitespace'
}

export const pluralize = (entity: Entity, qt: number) => {
  if (qt === 1)
    return String(entity)
  switch (entity) {
    case Entity.CHARACTER: return 'characters'
    case Entity.PREDICATE: return 'predicates'
    case Entity.LETTER: return 'letters'
    case Entity.UPPERCASE_LETTER: return 'uppercase letters'
    case Entity.LOWER_CASE_LETTER: return 'lowercase letters'
    case Entity.DIGIT: return 'digits'
    case Entity.WHITESPACE: return 'whitespaces'
    default: throw new Error('unreacheable code')
  }
}