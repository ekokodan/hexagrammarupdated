
export enum GameMode {
  STANDARD = 'Standard',
  BLITZ = 'Blitz',
  ZEN = 'Zen',
}

export enum Topic {
  DAILY_LIFE = 'Daily Life',
  FOOD_DRINK = 'Food & Drink',
  TRAVEL = 'Travel',
  SCHOOL = 'School',
  FANTASY = 'Fantasy & Sci-Fi',
  CUSTOM = 'Custom Topic',
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum Tense {
  PRESENT = 'Présent',
  PASSE_COMPOSE = 'Passé Composé',
  FUTUR_PROCHE = 'Futur Proche',
  IMPARFAIT = 'Imparfait',
}

export enum PartOfSpeech {
  SUBJECT = 'Subject',
  VERB = 'Verb', // Standard conjugated verb
  VERB_AUX = 'Auxiliary', // Avoir, Etre, Aller
  VERB_INF = 'Infinitive', // Manger, Voir
  VERB_PP = 'Past Participle', // Mangé, Vu
  ARTICLE = 'Article', // le, la, un, une
  POSSESSIVE = 'Possessive', // mon, ma, ton, sa
  NOUN = 'Noun',
  ADJECTIVE = 'Adjective',
  PREPOSITION = 'Preposition', // à, de, dans, sur
  ADVERB = 'Adverb',
  OBJECT = 'Object',
  CONNECTOR = 'Connector', // Conjunctions (et, mais, ou)
  NEGATION = 'Negation' // ne, pas, jamais
}

export interface Word {
  id: string;
  text: string;
  type: PartOfSpeech;
  translation: string;
  tags?: string[]; // e.g. 'masculine', 'plural'
}

export interface SentenceSlot {
  id: string;
  type: PartOfSpeech;
  value: Word | null;
  placeholder: string;
  fixed?: boolean; // If we want to pre-fill a slot
}

export interface GameSettings {
  mode: GameMode;
  topic: Topic;
  customTopic?: string; // New field for user input
  tense: Tense;
  difficulty: Difficulty;
}

export interface ValidationResult {
  isValid: boolean;
  correction: string;
  explanation: string;
  translation: string;
  feedbackType: 'perfect' | 'minor_error' | 'grammar_fail' | 'nonsense';
  followUpQuestion?: string; // New field for challenge mode
}

export interface GameState {
  score: number;
  sentencesCompleted: number;
  timeLeft: number; // in seconds
  isPlaying: boolean;
  isGameOver: boolean;
}
