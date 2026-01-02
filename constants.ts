import { Difficulty, PartOfSpeech, SentenceSlot, Tense, Topic, Word } from './types';

// Helper to create words
export const createWord = (text: string, type: PartOfSpeech, translation: string, tags: string[] = []): Word => ({
  id: `${text}-${type}-${Math.random().toString(36).substr(2, 9)}`,
  text,
  type,
  translation,
  tags
});

// Helper to generate standard -er verb conjugations (Present Tense)
export const generateErVerbs = (root: string, translationBase: string): Word[] => {
  const stem = root.slice(0, -2);
  
  // Handle special cases for -ger and -cer verbs in the "Nous" form to preserve pronunciation
  let nousForm = `${stem}ons`;
  if (root.endsWith('ger')) {
      nousForm = `${stem}eons`; // manger -> mangeons
  } else if (root.endsWith('cer')) {
      nousForm = `${stem.slice(0, -1)}çons`; // commencer -> commençons
  }

  // Handle -yer verbs (nettoyer -> nettoie) changing y to i in singular and 3rd person plural
  const isYer = root.endsWith('yer');
  const singularStem = isYer ? stem.slice(0, -1) + 'i' : stem;

  return [
    createWord(`${singularStem}e`, PartOfSpeech.VERB, `${translationBase} (Je/Il)`, ['Je', 'Il', 'Elle']),
    createWord(`${singularStem}es`, PartOfSpeech.VERB, `${translationBase} (Tu)`, ['Tu']),
    createWord(nousForm, PartOfSpeech.VERB, `${translationBase} (Nous)`, ['Nous']),
    createWord(`${stem}ez`, PartOfSpeech.VERB, `${translationBase} (Vous)`, ['Vous']),
    createWord(`${singularStem}ent`, PartOfSpeech.VERB, `${translationBase} (Ils/Elles)`, ['Ils', 'Elles']),
  ];
};

// --- Word Categories ---

const NEGATIONS: Word[] = [
    createWord('ne', PartOfSpeech.NEGATION, 'not (part 1)'),
    createWord('pas', PartOfSpeech.NEGATION, 'not (part 2)'),
    createWord('jamais', PartOfSpeech.NEGATION, 'never'),
    createWord('plus', PartOfSpeech.NEGATION, 'anymore'),
    createWord('rien', PartOfSpeech.NEGATION, 'nothing'),
];

const CONNECTORS: Word[] = [
  createWord('et', PartOfSpeech.CONNECTOR, 'and'),
  createWord('mais', PartOfSpeech.CONNECTOR, 'but'),
  createWord('ou', PartOfSpeech.CONNECTOR, 'or'),
  createWord('car', PartOfSpeech.CONNECTOR, 'because (formal)'),
  createWord('parce que', PartOfSpeech.CONNECTOR, 'because'),
  createWord('à cause de', PartOfSpeech.CONNECTOR, 'because of (negative)'),
  createWord('grâce à', PartOfSpeech.CONNECTOR, 'thanks to (positive)'),
  createWord('donc', PartOfSpeech.CONNECTOR, 'therefore/so'),
  createWord('alors', PartOfSpeech.CONNECTOR, 'then/so'),
  createWord('puisque', PartOfSpeech.CONNECTOR, 'since/as'),
  createWord('si', PartOfSpeech.CONNECTOR, 'if'),
  createWord('quand', PartOfSpeech.CONNECTOR, 'when'),
  createWord('pendant que', PartOfSpeech.CONNECTOR, 'while'),
];

const PREPOSITIONS: Word[] = [
  createWord('à', PartOfSpeech.PREPOSITION, 'to/at'),
  createWord('de', PartOfSpeech.PREPOSITION, 'of/from/about'),
  createWord('avec', PartOfSpeech.PREPOSITION, 'with'),
  createWord('pour', PartOfSpeech.PREPOSITION, 'for'),
  createWord('dans', PartOfSpeech.PREPOSITION, 'in'),
  createWord('sur', PartOfSpeech.PREPOSITION, 'on'),
  createWord('sous', PartOfSpeech.PREPOSITION, 'under'),
  createWord('chez', PartOfSpeech.PREPOSITION, 'at place of'),
  createWord('sans', PartOfSpeech.PREPOSITION, 'without'),
  createWord('avant', PartOfSpeech.PREPOSITION, 'before'),
  createWord('après', PartOfSpeech.PREPOSITION, 'after'),
  createWord('pendant', PartOfSpeech.PREPOSITION, 'during'),
];

const POSSESSIVES: Word[] = [
  createWord('mon', PartOfSpeech.POSSESSIVE, 'my (m)'),
  createWord('ma', PartOfSpeech.POSSESSIVE, 'my (f)'),
  createWord('mes', PartOfSpeech.POSSESSIVE, 'my (pl)'),
  createWord('ton', PartOfSpeech.POSSESSIVE, 'your (m)'),
  createWord('ta', PartOfSpeech.POSSESSIVE, 'your (f)'),
  createWord('tes', PartOfSpeech.POSSESSIVE, 'your (pl)'),
  createWord('son', PartOfSpeech.POSSESSIVE, 'his/her (m)'),
  createWord('sa', PartOfSpeech.POSSESSIVE, 'his/her (f)'),
  createWord('ses', PartOfSpeech.POSSESSIVE, 'his/her (pl)'),
  createWord('notre', PartOfSpeech.POSSESSIVE, 'our'),
  createWord('nos', PartOfSpeech.POSSESSIVE, 'our (pl)'),
  createWord('votre', PartOfSpeech.POSSESSIVE, 'your (formal)'),
  createWord('vos', PartOfSpeech.POSSESSIVE, 'your (pl form)'),
  createWord('leur', PartOfSpeech.POSSESSIVE, 'their'),
  createWord('leurs', PartOfSpeech.POSSESSIVE, 'their (pl)'),
];

const ARTICLES: Word[] = [
  createWord('le', PartOfSpeech.ARTICLE, 'the (m)'),
  createWord('la', PartOfSpeech.ARTICLE, 'the (f)'),
  createWord('l\'', PartOfSpeech.ARTICLE, 'the (vowel)'),
  createWord('un', PartOfSpeech.ARTICLE, 'a (m)'),
  createWord('une', PartOfSpeech.ARTICLE, 'a (f)'),
  createWord('les', PartOfSpeech.ARTICLE, 'the (pl)'),
  createWord('des', PartOfSpeech.ARTICLE, 'some'),
];

const SUBJECTS: Word[] = [
  createWord('Je', PartOfSpeech.SUBJECT, 'I'),
  createWord('Tu', PartOfSpeech.SUBJECT, 'You'),
  createWord('Il', PartOfSpeech.SUBJECT, 'He'),
  createWord('Elle', PartOfSpeech.SUBJECT, 'She'),
  createWord('Nous', PartOfSpeech.SUBJECT, 'We'),
  createWord('Vous', PartOfSpeech.SUBJECT, 'You (pl)'),
  createWord('Ils', PartOfSpeech.SUBJECT, 'They (m)'),
  createWord('Elles', PartOfSpeech.SUBJECT, 'They (f)'),
];

const AUX_ALLER: Word[] = [
  createWord('aller', PartOfSpeech.VERB_INF, 'to go (Aux)'), // Added Inf
  createWord('vais', PartOfSpeech.VERB_AUX, 'am going (Je)', ['Je']),
  createWord('vas', PartOfSpeech.VERB_AUX, 'are going (Tu)', ['Tu']),
  createWord('va', PartOfSpeech.VERB_AUX, 'is going (Il/Elle)', ['Il', 'Elle']),
  createWord('allons', PartOfSpeech.VERB_AUX, 'are going (Nous)', ['Nous']),
  createWord('allez', PartOfSpeech.VERB_AUX, 'are going (Vous)', ['Vous']),
  createWord('vont', PartOfSpeech.VERB_AUX, 'are going (Ils/Elles)', ['Ils', 'Elles']),
  createWord('allé', PartOfSpeech.VERB_PP, 'gone'), // Added PP
];

const AUX_AVOIR_ETRE: Word[] = [
  createWord('avoir', PartOfSpeech.VERB_INF, 'to have (Aux)'), // Added Inf
  createWord('être', PartOfSpeech.VERB_INF, 'to be (Aux)'), // Added Inf
  
  // Avoir Conjugations
  createWord('ai', PartOfSpeech.VERB_AUX, 'have (Je)', ['Je']),
  createWord('as', PartOfSpeech.VERB_AUX, 'have (Tu)', ['Tu']),
  createWord('a', PartOfSpeech.VERB_AUX, 'has (Il/Elle)', ['Il', 'Elle']),
  createWord('avons', PartOfSpeech.VERB_AUX, 'have (Nous)', ['Nous']),
  createWord('avez', PartOfSpeech.VERB_AUX, 'have (Vous)', ['Vous']),
  createWord('ont', PartOfSpeech.VERB_AUX, 'have (Ils/Elles)', ['Ils', 'Elles']),
  createWord('eu', PartOfSpeech.VERB_PP, 'had'), // PP Avoir

  // Etre Conjugations
  createWord('suis', PartOfSpeech.VERB_AUX, 'am (Je)', ['Je']),
  createWord('es', PartOfSpeech.VERB_AUX, 'are (Tu)', ['Tu']),
  createWord('est', PartOfSpeech.VERB_AUX, 'is (Il/Elle)', ['Il', 'Elle']),
  createWord('sommes', PartOfSpeech.VERB_AUX, 'are (Nous)', ['Nous']),
  createWord('êtes', PartOfSpeech.VERB_AUX, 'are (Vous)', ['Vous']),
  createWord('sont', PartOfSpeech.VERB_AUX, 'are (Ils/Elles)', ['Ils', 'Elles']),
  createWord('été', PartOfSpeech.VERB_PP, 'been'), // PP Etre
];

// Combine common pools
export const COMMON_WORDS: Word[] = [
  ...SUBJECTS,
  ...ARTICLES,
  ...POSSESSIVES,
  ...PREPOSITIONS,
  ...CONNECTORS,
  ...AUX_ALLER,
  ...AUX_AVOIR_ETRE,
  ...NEGATIONS
];

// Topic-specific pools
export const TOPIC_POOLS: Record<Topic, Word[]> = {
  [Topic.CUSTOM]: [], 
  [Topic.DAILY_LIFE]: [
    createWord('manger', PartOfSpeech.VERB_INF, 'to eat'),
    createWord('regarder', PartOfSpeech.VERB_INF, 'to watch'),
    createWord('dormir', PartOfSpeech.VERB_INF, 'to sleep'),
    createWord('parler', PartOfSpeech.VERB_INF, 'to speak'),
    createWord('mangé', PartOfSpeech.VERB_PP, 'eaten'),
    createWord('regardé', PartOfSpeech.VERB_PP, 'watched'),
    createWord('dormi', PartOfSpeech.VERB_PP, 'slept'),
    createWord('parlé', PartOfSpeech.VERB_PP, 'spoken'),
    
    // Nouns
    createWord('chat', PartOfSpeech.NOUN, 'cat', ['m', 'mutable']),
    createWord('chien', PartOfSpeech.NOUN, 'dog', ['m', 'mutable']),
    createWord('télé', PartOfSpeech.NOUN, 'TV', ['f']),
    createWord('maison', PartOfSpeech.NOUN, 'house', ['f']),
    createWord('voiture', PartOfSpeech.NOUN, 'car', ['f']),
    createWord('ami', PartOfSpeech.NOUN, 'friend', ['m', 'mutable']), 
    createWord('famille', PartOfSpeech.NOUN, 'family', ['f']),
    createWord('travail', PartOfSpeech.NOUN, 'work', ['m']),
    createWord('école', PartOfSpeech.NOUN, 'school', ['f']),
    
    // Adjectives
    createWord('rapide', PartOfSpeech.ADJECTIVE, 'fast'),
    createWord('fatigué', PartOfSpeech.ADJECTIVE, 'tired'),
    createWord('rouge', PartOfSpeech.ADJECTIVE, 'red'),
    createWord('heureux', PartOfSpeech.ADJECTIVE, 'happy'),
    createWord('grand', PartOfSpeech.ADJECTIVE, 'big'),
    createWord('petit', PartOfSpeech.ADJECTIVE, 'small'),
  ],
  [Topic.FOOD_DRINK]: [
    createWord('cuisiner', PartOfSpeech.VERB_INF, 'to cook'),
    createWord('boire', PartOfSpeech.VERB_INF, 'to drink'),
    createWord('commander', PartOfSpeech.VERB_INF, 'to order'),
    createWord('dîner', PartOfSpeech.VERB_INF, 'to have dinner'),
    createWord('prendre', PartOfSpeech.VERB_INF, 'to take'),
    createWord('cuisiné', PartOfSpeech.VERB_PP, 'cooked'),
    createWord('bu', PartOfSpeech.VERB_PP, 'drunk'),
    createWord('commandé', PartOfSpeech.VERB_PP, 'ordered'),
    createWord('pris', PartOfSpeech.VERB_PP, 'taken'),

    createWord('pizza', PartOfSpeech.NOUN, 'pizza', ['f']),
    createWord('café', PartOfSpeech.NOUN, 'coffee', ['m']),
    createWord('pomme', PartOfSpeech.NOUN, 'apple', ['f']),
    createWord('eau', PartOfSpeech.NOUN, 'water', ['f']),
    createWord('restaurant', PartOfSpeech.NOUN, 'restaurant', ['m']),
    createWord('pain', PartOfSpeech.NOUN, 'bread', ['m']),
    createWord('lait', PartOfSpeech.NOUN, 'milk', ['m']),
    
    createWord('délicieux', PartOfSpeech.ADJECTIVE, 'delicious'),
    createWord('chaud', PartOfSpeech.ADJECTIVE, 'hot'),
    createWord('frais', PartOfSpeech.ADJECTIVE, 'fresh'),
    createWord('épicé', PartOfSpeech.ADJECTIVE, 'spicy'),
  ],
  [Topic.TRAVEL]: [
    createWord('voyager', PartOfSpeech.VERB_INF, 'to travel'),
    createWord('visiter', PartOfSpeech.VERB_INF, 'to visit'),
    createWord('partir', PartOfSpeech.VERB_INF, 'to leave'),
    createWord('marcher', PartOfSpeech.VERB_INF, 'to walk'),
    createWord('voyagé', PartOfSpeech.VERB_PP, 'traveled'),
    createWord('visité', PartOfSpeech.VERB_PP, 'visited'),
    createWord('parti', PartOfSpeech.VERB_PP, 'left'),
    
    createWord('train', PartOfSpeech.NOUN, 'train', ['m']),
    createWord('avion', PartOfSpeech.NOUN, 'plane', ['m']),
    createWord('plage', PartOfSpeech.NOUN, 'beach', ['f']),
    createWord('paris', PartOfSpeech.NOUN, 'Paris', ['m']),
    createWord('hôtel', PartOfSpeech.NOUN, 'hotel', ['m']),
    createWord('monde', PartOfSpeech.NOUN, 'world', ['m']),
    createWord('pays', PartOfSpeech.NOUN, 'country', ['m']),
    
    createWord('beau', PartOfSpeech.ADJECTIVE, 'beautiful'),
    createWord('loin', PartOfSpeech.ADJECTIVE, 'far'),
    createWord('grand', PartOfSpeech.ADJECTIVE, 'big'),
  ],
  [Topic.SCHOOL]: [
    createWord('étudier', PartOfSpeech.VERB_INF, 'to study'),
    createWord('apprendre', PartOfSpeech.VERB_INF, 'to learn'),
    createWord('écrire', PartOfSpeech.VERB_INF, 'to write'),
    createWord('lire', PartOfSpeech.VERB_INF, 'to read'),
    createWord('écouter', PartOfSpeech.VERB_INF, 'to listen'),
    createWord('étudié', PartOfSpeech.VERB_PP, 'studied'),
    createWord('appris', PartOfSpeech.VERB_PP, 'learned'),
    createWord('écrit', PartOfSpeech.VERB_PP, 'written'),
    createWord('lu', PartOfSpeech.VERB_PP, 'read'),
    
    createWord('livre', PartOfSpeech.NOUN, 'book', ['m']),
    createWord('leçon', PartOfSpeech.NOUN, 'lesson', ['f']),
    createWord('stylo', PartOfSpeech.NOUN, 'pen', ['m']),
    createWord('examen', PartOfSpeech.NOUN, 'exam', ['m']),
    createWord('professeur', PartOfSpeech.NOUN, 'teacher', ['m']),
    createWord('classe', PartOfSpeech.NOUN, 'class', ['f']),
    
    createWord('difficile', PartOfSpeech.ADJECTIVE, 'difficult'),
    createWord('facile', PartOfSpeech.ADJECTIVE, 'easy'),
    createWord('intelligent', PartOfSpeech.ADJECTIVE, 'smart'),
  ],
  [Topic.FANTASY]: [
    createWord('attaquer', PartOfSpeech.VERB_INF, 'to attack'),
    createWord('voler', PartOfSpeech.VERB_INF, 'to fly'),
    createWord('disparaître', PartOfSpeech.VERB_INF, 'to disappear'),
    createWord('préparer', PartOfSpeech.VERB_INF, 'to prepare'),
    createWord('attaqué', PartOfSpeech.VERB_PP, 'attacked'),
    createWord('volé', PartOfSpeech.VERB_PP, 'flown'),
    createWord('disparu', PartOfSpeech.VERB_PP, 'disappeared'),
    
    createWord('dragon', PartOfSpeech.NOUN, 'dragon', ['m']),
    createWord('sorcier', PartOfSpeech.NOUN, 'wizard', ['m', 'mutable']),
    createWord('château', PartOfSpeech.NOUN, 'castle', ['m']),
    createWord('potion', PartOfSpeech.NOUN, 'potion', ['f']),
    createWord('épée', PartOfSpeech.NOUN, 'sword', ['f']),
    
    createWord('magique', PartOfSpeech.ADJECTIVE, 'magical'),
    createWord('dangereux', PartOfSpeech.ADJECTIVE, 'dangerous'),
    createWord('invisible', PartOfSpeech.ADJECTIVE, 'invisible'),
    createWord('puissant', PartOfSpeech.ADJECTIVE, 'powerful'),
  ]
};

export const getWordsForGame = (topic: Topic): Word[] => {
  return [...COMMON_WORDS, ...TOPIC_POOLS[topic]];
};

// Returns a Minimal starter seed
export const getStarterSentence = (): PartOfSpeech[] => {
  return []; // Return empty array to leave the board blank for the user
};

export const getTenseHint = (tense: Tense): string => {
  switch (tense) {
    case Tense.FUTUR_PROCHE: return "Hint: Subject + Aller + Infinitive";
    case Tense.PASSE_COMPOSE: return "Hint: Subject + Avoir/Être + Participle";
    case Tense.IMPARFAIT: return "Hint: Describe a past state or habit";
    default: return "Hint: Subject + Verb + (Object/Adjective)";
  }
};

// --- Variation Logic ---

const irregularAdjectives: Record<string, { f: string, mpl: string, fpl: string }> = {
  'beau': { f: 'belle', mpl: 'beaux', fpl: 'belles' },
  'nouveau': { f: 'nouvelle', mpl: 'nouveaux', fpl: 'nouvelles' },
  'vieux': { f: 'vieille', mpl: 'vieux', fpl: 'vieilles' },
  'frais': { f: 'fraîche', mpl: 'frais', fpl: 'fraîches' },
  'blanc': { f: 'blanche', mpl: 'blancs', fpl: 'blanches' },
  'heureux': { f: 'heureuse', mpl: 'heureux', fpl: 'heureuses' },
  'délicieux': { f: 'délicieuse', mpl: 'délicieux', fpl: 'délicieuses' },
  'dangereux': { f: 'dangereuse', mpl: 'dangereux', fpl: 'dangereuses' },
};

export const generateVariations = (word: Word, gender: 'm' | 'f', number: 's' | 'pl'): Word => {
  // Return a new Word object with modified text and translation
  const suffix = number === 'pl' ? '(pl)' : '';
  const gTag = gender === 'm' ? '(m)' : '(f)';
  
  if (word.type === PartOfSpeech.NOUN) {
    let text = word.text;
    
    // Gender Transformation (Only if requested Feminine and not already Feminine)
    // AND Check if it is a standard masculine base to avoid double transformation
    const isFemTag = word.tags?.includes('f') || word.tags?.includes('feminine');
    
    if (gender === 'f' && !isFemTag) {
        // Handle irregular noun feminization
        if (text === 'chat') text = 'chatte';
        else if (text === 'chien') text = 'chienne';
        else if (text === 'sorcier') text = 'sorcière';
        else if (text.endsWith('er')) text = text.slice(0, -2) + 'ère'; // e.g. écolier -> écolière
        else if (text.endsWith('f')) text = text.slice(0, -1) + 've';
        else if (text.endsWith('x')) text = text.slice(0, -1) + 'se';
        else if (!text.endsWith('e')) text += 'e';
    }

    // Plural Transformation
    if (number === 'pl') {
        if (text.endsWith('s') || text.endsWith('x') || text.endsWith('z')) {
            // no change
        } else if (text.endsWith('au') || text.endsWith('eu')) {
            text += 'x';
        } else if (text.endsWith('al')) {
            text = text.slice(0, -2) + 'aux'; // cheval -> chevaux
        } else {
            text += 's';
        }
    }
    return {
        ...word,
        text: text,
        tags: [gender === 'f' ? 'feminine' : 'masculine', number === 'pl' ? 'plural' : 'singular']
    };
  }

  if (word.type === PartOfSpeech.ADJECTIVE) {
    let text = word.text;
    // Check irregulars first
    if (irregularAdjectives[word.text]) {
        const forms = irregularAdjectives[word.text];
        if (gender === 'f' && number === 's') text = forms.f;
        else if (gender === 'm' && number === 'pl') text = forms.mpl;
        else if (gender === 'f' && number === 'pl') text = forms.fpl;
    } else {
        // Regular rules
        if (gender === 'f') {
            if (!text.endsWith('e')) text += 'e';
        }
        if (number === 'pl') {
             if (text.endsWith('s') || text.endsWith('x')) {
                 // no change
             } else if (text.endsWith('au')) {
                 text += 'x';
             } else {
                 text += 's';
             }
        }
    }
    return {
        ...word,
        text,
        tags: [...(word.tags || []), gender === 'f' ? 'feminine' : 'masculine', number === 'pl' ? 'plural' : 'singular']
    };
  }

  return word;
};

// Helper to get all forms of a verb (Inf, PP, Conjugations)
export const getVerbForms = (rootVerb: Word): { inf: Word, pp: Word | null, conjugations: Word[] } => {
    // If it's Avoir
    if (rootVerb.text === 'avoir') {
        const inf = rootVerb;
        const pp = AUX_AVOIR_ETRE.find(w => w.type === PartOfSpeech.VERB_PP && w.text === 'eu') || null;
        
        // Strict filter for Avoir
        const avoirForms = ['ai', 'as', 'a', 'avons', 'avez', 'ont'];
        const conjugations = AUX_AVOIR_ETRE.filter(w => w.type === PartOfSpeech.VERB_AUX && avoirForms.includes(w.text));
        
        return { inf, pp, conjugations };
    }
    // If it's Etre
    if (rootVerb.text === 'être') {
        const inf = rootVerb;
        const pp = AUX_AVOIR_ETRE.find(w => w.type === PartOfSpeech.VERB_PP && w.text === 'été') || null;

        // Strict filter for Etre
        const etreForms = ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'];
        const conjugations = AUX_AVOIR_ETRE.filter(w => w.type === PartOfSpeech.VERB_AUX && etreForms.includes(w.text));
        
        return { inf, pp, conjugations };
    }
    // If it's Aller
    if (rootVerb.text === 'aller') {
         const inf = rootVerb;
         const pp = AUX_ALLER.find(w => w.type === PartOfSpeech.VERB_PP) || null;
         const conjugations = AUX_ALLER.filter(w => w.type === PartOfSpeech.VERB_AUX);
         return { inf, pp, conjugations };
    }
    
    // Regular -er verbs (and custom verbs generated by AI which are usually simple)
    if (rootVerb.text.endsWith('er') || rootVerb.text.endsWith('ir') || rootVerb.text.endsWith('re')) {
        // We assume we can generate or find the forms in the current pool or generate them on the fly
        // For -er verbs specifically:
        if (rootVerb.text.endsWith('er')) {
            const conjugations = generateErVerbs(rootVerb.text, rootVerb.translation.replace('to ', ''));
            const ppText = rootVerb.text.slice(0, -2) + 'é';
            const pp = createWord(ppText, PartOfSpeech.VERB_PP, 'Past Participle');
            return { inf: rootVerb, pp, conjugations };
        }
    }
    
    // Fallback for irregulars in Topic lists that aren't Avoir/Etre/Aller (e.g., Boire, Lire)
    // For now, we only support generating standard ER or manually finding forms if they exist in the pool.
    // In this simplified version, we'll try to generate crude conjugations if missing, or return empty.
    
    return { inf: rootVerb, pp: null, conjugations: [] };
};

// Helper: French Elision Logic (Contractions)
// Converts "Je ai" -> "J'ai", "Le avion" -> "L'avion" etc.
// Keep for fallback/validation string generation
export const applyFrenchElision = (sentence: string): string => {
    return sentence
        // Je/Me/Te/Se/Le/La/De/Ne/Que/Ce + Vowel or H
        .replace(/\b(je|me|te|se|le|la|de|ne|que|ce)\s+([aeiouyéàèùâêîôûh])/gi, (match, p1, p2) => {
            const word = p1.toLowerCase();
            const nextChar = p2.toLowerCase();
            
            if (word === 'ce') {
                if (nextChar === 'e' || nextChar === 'é') return p1.slice(0, -1) + "'" + p2;
                return match; 
            }

            return p1.slice(0, -1) + "'" + p2;
        })
        .replace(/\b(si)\s+(il)/gi, (match, p1, p2) => {
             return "s'" + p2;
        });
};

// --- VISUAL SLOT MERGE LOGIC ---

// Helper to check if two slots should trigger an elision
const shouldElide = (s1: SentenceSlot, s2: SentenceSlot): boolean => {
    if (!s1.value || !s2.value) return false;
    const w1 = s1.value.text.toLowerCase();
    const w2 = s2.value.text.toLowerCase();
    
    // Triggers
    const elisionTriggers = ['je', 'me', 'te', 'se', 'le', 'la', 'de', 'ne', 'que', 'jusque', 'si', 'ce'];
    if (!elisionTriggers.includes(w1)) return false;
    
    // Target Vowels
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'h', 'é', 'è', 'ê'];
    if (!vowels.includes(w2.charAt(0))) return false;
    
    // Specific exceptions
    if (w1 === 'si' && !w2.startsWith('il')) return false;
    // 'Ce' mostly only elides with est/était/été in common usage
    if (w1 === 'ce' && !w2.startsWith('est') && !w2.startsWith('ét')) return false; 
    
    return true;
}

// Finds the first pair of slots that need elision
export const findElisionCandidate = (slots: SentenceSlot[]): { index: number, mergedSlot: SentenceSlot } | null => {
  for (let i = 0; i < slots.length - 1; i++) {
     if (shouldElide(slots[i], slots[i+1])) {
        const current = slots[i];
        const next = slots[i+1];
        
        // Merge logic
        const w1 = current.value!.text;
        const w2 = next.value!.text;
        
        let prefix = w1.slice(0, -1); // je -> j
        if (w1.toLowerCase() === 'si') prefix = w1.slice(0, -1); // si -> s, keep case if S
        
        // Construct merged text (e.g. J'ai)
        const mergedText = `${prefix}'${w2}`;
        
        const mergedWord: Word = {
            id: `${current.value!.id}+${next.value!.id}`,
            text: mergedText,
            type: next.value!.type, // Inherit type of the substantive/verb/main word
            translation: `${current.value!.translation} + ${next.value!.translation}`,
            tags: [...(current.value!.tags || []), ...(next.value!.tags || [])]
        };
        
        const mergedSlot: SentenceSlot = {
            id: current.id, // Reuse ID of the first slot
            type: next.type, // Use type of the second slot (usually the main word)
            value: mergedWord,
            placeholder: next.placeholder
        };

        return { index: i, mergedSlot };
     }
  }
  return null;
}