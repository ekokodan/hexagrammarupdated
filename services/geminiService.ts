import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Tense, Topic, ValidationResult, Word, PartOfSpeech } from "../types";
import { createWord } from "../constants";

const apiKey = process.env.API_KEY;
// We use Gemini 3 Flash for speed as this is an interactive game
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-will-fail-if-not-set' });

const validationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isValid: { type: Type.BOOLEAN, description: "Whether the French sentence is grammatically correct considering the target tense." },
    correction: { type: Type.STRING, description: "The corrected version of the sentence if invalid, or the same sentence if valid." },
    explanation: { type: Type.STRING, description: "Educational feedback. If invalid, explain the grammar rule broken. If valid, give a brief compliment." },
    translation: { type: Type.STRING, description: "The English translation of the intended sentence." },
    feedbackType: { type: Type.STRING, enum: ["perfect", "minor_error", "grammar_fail", "nonsense"], description: "Category of the result." },
    followUpQuestion: { type: Type.STRING, description: "If the sentence is valid, generate a simple, short follow-up question in French related to the sentence that the student could answer next. If invalid, leave empty." }
  },
  required: ["isValid", "correction", "explanation", "translation", "feedbackType"],
};

const wordPackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        nouns: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "French noun (singular)" },
                    translation: { type: Type.STRING, description: "English translation" },
                    gender: { type: Type.STRING, enum: ['m', 'f'], description: "Gender of the noun" }
                },
                required: ['text', 'translation', 'gender']
            }
        },
        adjectives: {
             type: Type.ARRAY,
             items: {
                type: Type.OBJECT,
                 properties: {
                     text: { type: Type.STRING, description: "French adjective (masculine singular)" },
                     translation: { type: Type.STRING, description: "English translation" }
                 },
                 required: ['text', 'translation']
             }
        },
        verbs: {
             type: Type.ARRAY,
             items: {
                type: Type.OBJECT,
                 properties: {
                     text: { type: Type.STRING, description: "French verb (infinitive)" },
                     translation: { type: Type.STRING, description: "English translation" }
                 },
                 required: ['text', 'translation']
             }
        }
    },
    required: ['nouns', 'adjectives', 'verbs']
}

const inspirationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        englishSentence: { type: Type.STRING, description: "A simple English sentence achievable with the provided vocabulary." },
        frenchTarget: { type: Type.STRING, description: "The French translation (for verification)." }
    },
    required: ["englishSentence"]
};

export const validateSentence = async (
  sentence: string,
  tense: Tense,
  topic: Topic,
  availableWords: Word[],
  contextQuestion?: string | null,
  previousQuestions: string[] = []
): Promise<ValidationResult> => {
  if (!apiKey) {
    console.warn("API Key missing. Returning mock response.");
    return {
      isValid: true,
      correction: sentence,
      explanation: "Demo mode (No API Key): Looks good!",
      translation: "This is a demo translation.",
      feedbackType: "perfect",
      followUpQuestion: "Et toi, ça va ?"
    };
  }

  try {
    let contextInstruction = "";
    if (contextQuestion) {
        contextInstruction = `
        CONTEXT: The student is answering this question: "${contextQuestion}".
        Check if the sentence "${sentence}" is a logical and grammatical response to the question. 
        If it is grammatically correct but makes no sense as an answer, mark it as invalid (nonsense).
        `;
    }

    // Filter out variations to keep prompt cleaner, just base words or unique text
    const vocabularyList = availableWords
        .map(w => `${w.text} (${w.translation})`)
        .slice(0, 200) // Safety limit though unlikely to hit
        .join(", ");

    const avoidedQuestions = previousQuestions.length > 0 
        ? previousQuestions.map(q => `- "${q}"`).join("\n")
        : "None";

    const prompt = `
      You are an expert French language tutor.
      
      Task: Evaluate this sentence constructed by a student.
      Sentence: "${sentence}"
      Required Tense: ${tense}
      Topic: ${topic}
      ${contextInstruction}

      Student's Vocabulary Context:
      The student only has access to the following words/blocks to build sentences:
      [${vocabularyList}]
      
      HISTORY CONSTRAINTS (IMPORTANT):
      You have already asked the following questions in this session. DO NOT repeat them or ask extremely similar variations.
      ${avoidedQuestions}

      Instructions:
      1. STRICTLY check if the sentence uses the Required Tense correctly.
      2. Check Subject-Verb agreement.
      3. Check Noun-Adjective agreement (gender/number).
      4. If the sentence makes no semantic sense (random words), mark as invalid (nonsense).
      5. Provide a helpful, short explanation suitable for a beginner/intermediate learner.
      6. If Valid: Generate a simple follow-up question (in French) to challenge the student further.
         CRITICAL RULE A: The follow-up question MUST be answerable using ONLY the vocabulary provided in the "Student's Vocabulary Context" above.
         CRITICAL RULE B: The follow-up question MUST be distinct from the 'HISTORY CONSTRAINTS' listed above. Change the subject or verb if needed to ensure variety.
      
      Return result in JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: validationSchema,
        temperature: 0.5, // Increased slightly to encourage variety in questions
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText) as ValidationResult;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      isValid: false,
      correction: sentence,
      explanation: "Something went wrong with the AI judge. Please try again.",
      translation: "Error translating.",
      feedbackType: "minor_error"
    };
  }
};

export const generateWordPack = async (customTopic: string): Promise<{ nouns: any[], adjectives: any[], verbs: any[] }> => {
    if (!apiKey) return { nouns: [], adjectives: [], verbs: [] };

    try {
        const prompt = `
        Generate a vocabulary list for French learning based on the custom topic: "${customTopic}".
        
        Provide:
        - 12 Nouns (mix of masculine/feminine)
        - 6 Adjectives (relevant to the topic)
        - 6 Verbs (Infinitives). Try to prefer regular -er verbs if possible to make conjugation easier for beginners, but include key irregulars if essential to the topic.

        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: wordPackSchema,
                temperature: 0.7
            }
        });
        
        const jsonText = response.text || "{}";
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Gemini Word Pack Error:", error);
        return { nouns: [], adjectives: [], verbs: [] };
    }
}

export const generateInspiration = async (availableWords: Word[], tense: Tense): Promise<{ englishSentence: string }> => {
    if (!apiKey) return { englishSentence: "The cat eats the apple." };

    try {
        const vocabularyList = availableWords
        .map(w => `${w.text} (${w.type})`)
        .slice(0, 300)
        .join(", ");

        const prompt = `
        Task: Create a simple ENGLISH sentence that a student can translate into French.
        Target Tense: ${tense}
        
        Constraints:
        1. The French translation MUST be achievable using ONLY the vocabulary list below.
        2. You can assume the student can conjugate verbs (e.g., if 'manger' is listed, they can write 'je mange').
        3. Keep it simple and natural.
        
        Vocabulary List:
        [${vocabularyList}]

        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: inspirationSchema,
                temperature: 0.8
            }
        });

        const jsonText = response.text || "{}";
        const res = JSON.parse(jsonText);
        return { englishSentence: res.englishSentence || "Try building a simple sentence." };

    } catch (error) {
        console.error("Gemini Inspiration Error:", error);
        return { englishSentence: "Try describing something nearby." };
    }
}