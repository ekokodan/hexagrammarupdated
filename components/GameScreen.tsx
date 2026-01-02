import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, GameState, SentenceSlot, Word, PartOfSpeech, GameMode, ValidationResult, Topic, Tense } from '../types';
import { getWordsForGame, getStarterSentence, getTenseHint, generateVariations, COMMON_WORDS, createWord, generateErVerbs, getVerbForms, applyFrenchElision, findElisionCandidate } from '../constants';
import { validateSentence, generateWordPack, generateInspiration } from '../services/geminiService';
import { WordSlot } from './WordSlot';
import { ForgeLoading } from './ForgeLoading';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, XCircleIcon, HomeIcon, LightBulbIcon, PlusIcon, AdjustmentsHorizontalIcon, SparklesIcon, FlagIcon, FireIcon } from '@heroicons/react/24/solid';

interface GameScreenProps {
  settings: GameSettings;
  onExit: () => void;
}

// Helper for Sidebar Labels (Full French Names)
const getCategoryLabel = (type: PartOfSpeech) => {
    switch (type) {
        case PartOfSpeech.SUBJECT: return 'Sujet';
        case PartOfSpeech.VERB: return 'Verbe';
        case PartOfSpeech.VERB_AUX: return 'Verbe'; // Merged
        case PartOfSpeech.VERB_INF: return 'Verbe'; // Merged
        case PartOfSpeech.VERB_PP: return 'Verbe'; // Merged
        case PartOfSpeech.NOUN: return 'Nom';
        case PartOfSpeech.ADJECTIVE: return 'Adjectif';
        case PartOfSpeech.ARTICLE: return 'Article';
        case PartOfSpeech.POSSESSIVE: return 'Possessif';
        case PartOfSpeech.PREPOSITION: return 'Préposition';
        case PartOfSpeech.CONNECTOR: return 'Lien / Conj.';
        case PartOfSpeech.NEGATION: return 'Négation';
        default: return type;
    }
};

export const GameScreen: React.FC<GameScreenProps> = ({ settings, onExit }) => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    sentencesCompleted: 0,
    timeLeft: 60,
    isPlaying: true,
    isGameOver: false,
  });

  const [slots, setSlots] = useState<SentenceSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<PartOfSpeech>(PartOfSpeech.VERB);
  
  // Word Pool State
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  
  // Customization State
  const [customizingWord, setCustomizingWord] = useState<Word | null>(null);
  const [customGender, setCustomGender] = useState<'m' | 'f'>('m');
  const [customNumber, setCustomNumber] = useState<'s' | 'pl'>('s');

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Inspiration State
  const [inspiration, setInspiration] = useState<string | null>(null);
  const [isLoadingInspiration, setIsLoadingInspiration] = useState(false);
  
  // Merge Animation State
  const [mergingIndex, setMergingIndex] = useState<number | null>(null);

  // Challenge State
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [isChallengeSticky, setIsChallengeSticky] = useState(false);
  
  // Question History to prevent repetition
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);

  // Drag State
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);

  // Refs for scrolling and observers
  const timerRef = useRef<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // Memoize word pool (Combine Common + Topic + Custom)
  const wordPool = React.useMemo(() => {
      if (settings.topic === Topic.CUSTOM) {
          return [...COMMON_WORDS, ...customWords];
      }
      return getWordsForGame(settings.topic);
  }, [settings.topic, customWords]);

  // --- Scroll Logic ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPicker = () => {
      // Small timeout to ensure DOM render before scroll
      setTimeout(() => {
          if (pickerRef.current) {
              pickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }, 100);
  };

  // --- Intersection Observer for Sticky Challenge ---
  useEffect(() => {
    if (!challengeRef.current || !activeChallenge) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the main challenge card is scrolling out of view (top < 120px roughly accounts for header)
        // We trigger the sticky header version
        const isScrollingPast = !entry.isIntersecting && entry.boundingClientRect.top < 100;
        setIsChallengeSticky(isScrollingPast);
      },
      { threshold: 0.2, rootMargin: '-100px 0px 0px 0px' } 
    );

    observer.observe(challengeRef.current);
    return () => observer.disconnect();
  }, [activeChallenge]);

  // --- Auto-Merge Elisions (Animated Step-by-Step) ---
  useEffect(() => {
    // If currently animating a merge, wait for it to finish.
    if (mergingIndex !== null) return;

    // Check if any adjacent slots should be merged
    const candidate = findElisionCandidate(slots);
    
    if (candidate) {
        // Start animation phase
        setMergingIndex(candidate.index);

        // After animation duration (600ms), apply the merge
        setTimeout(() => {
             setSlots(prevSlots => {
                 // Re-verify the candidate is still valid (in case state changed rapidly)
                 const freshCandidate = findElisionCandidate(prevSlots);
                 if (freshCandidate && freshCandidate.index === candidate.index) {
                     const newSlots = [...prevSlots];
                     // Replace 2 slots with 1
                     newSlots.splice(candidate.index, 2, candidate.mergedSlot);
                     return newSlots;
                 }
                 return prevSlots;
             });
             setMergingIndex(null);
        }, 550); // Slightly less than CSS animation to ensure snap feels responsive
    }
  }, [slots, mergingIndex]);

  // --- Initialization ---
  useEffect(() => {
    const initGame = async () => {
        if (settings.topic === Topic.CUSTOM && settings.customTopic) {
            setIsLoadingWords(true);
            const pack = await generateWordPack(settings.customTopic);
            
            // Process AI Response into Word objects
            const nouns = pack.nouns.map((n: any) => createWord(n.text, PartOfSpeech.NOUN, n.translation, [n.gender]));
            const adjs = pack.adjectives.map((a: any) => createWord(a.text, PartOfSpeech.ADJECTIVE, a.translation));
            
            // Process Verbs: Add Infinitives
            const verbs: Word[] = [];
            pack.verbs.forEach((v: any) => {
                const text = v.text.toLowerCase();
                verbs.push(createWord(text, PartOfSpeech.VERB_INF, `to ${v.translation}`));
            });

            setCustomWords([...nouns, ...adjs, ...verbs]);
            setIsLoadingWords(false);
        }
    };
    initGame();
  }, [settings.topic, settings.customTopic]);

  useEffect(() => {
    if (!isLoadingWords) {
        startNewRound();
        if (settings.mode === GameMode.BLITZ) {
            if (timerRef.current) clearInterval(timerRef.current); // Clear previous if any
            timerRef.current = window.setInterval(() => {
                setGameState(prev => {
                if (prev.timeLeft <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return { ...prev, timeLeft: 0, isGameOver: true, isPlaying: false };
                }
                return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingWords]); // Restart round when words are loaded

  const startNewRound = () => {
    // Wait for words if still loading
    if (isLoadingWords) return;

    scrollToTop();

    const starterTypes = getStarterSentence();
    const newSlots: SentenceSlot[] = starterTypes.map((type, index) => {
        const wordsOfType = wordPool.filter(w => w.type === type);
        // Fallback if pool is empty (shouldn't happen with common words, but safety check)
        const randomWord = wordsOfType.length > 0 
            ? wordsOfType[Math.floor(Math.random() * wordsOfType.length)]
            : createWord('?', type, 'error');
            
        return {
            id: `slot-${index}-${Date.now()}`,
            type: type,
            value: randomWord,
            placeholder: type.toString(),
        };
    });

    setSlots(newSlots);
    setValidation(null);
    setActiveSlotId(null);
    setIsAddingNew(false);
    setPickerCategory(PartOfSpeech.VERB);
    setCustomizingWord(null);
    setIsChallengeSticky(false);
    setMergingIndex(null);
    setInspiration(null);
    setIsLoadingInspiration(false);
  };

  // --- Derived Data: Filtered Categories ---
  const visibleCategories = React.useMemo(() => {
    return [
      PartOfSpeech.SUBJECT,
      PartOfSpeech.VERB, // Merged Verb Category
      PartOfSpeech.NEGATION, // Add NEGATION here
      PartOfSpeech.NOUN,
      PartOfSpeech.ADJECTIVE,
      PartOfSpeech.ARTICLE,
      PartOfSpeech.POSSESSIVE,
      PartOfSpeech.PREPOSITION,
      PartOfSpeech.CONNECTOR
    ];
  }, []);

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (mergingIndex !== null) { e.preventDefault(); return; } // Disable drag during merge
    setDraggedSlotIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSlotIndex === null || draggedSlotIndex === targetIndex || mergingIndex !== null) return;

    const newSlots = [...slots];
    const [draggedItem] = newSlots.splice(draggedSlotIndex, 1);
    newSlots.splice(targetIndex, 0, draggedItem);

    setSlots(newSlots);
    setDraggedSlotIndex(null);
  };

  // --- Interactions ---

  const handleSlotClick = (id: string) => {
    if (validation || mergingIndex !== null) return; // Disable click during merge
    setActiveSlotId(activeSlotId === id ? null : id);
    setIsAddingNew(false);
    setCustomizingWord(null);
    scrollToPicker();
    
    const slot = slots.find(s => s.id === id);
    if (slot) {
        // If slot is Aux/Inf/PP, select 'VERB' category
        if ([PartOfSpeech.VERB, PartOfSpeech.VERB_AUX, PartOfSpeech.VERB_INF, PartOfSpeech.VERB_PP].includes(slot.type)) {
            setPickerCategory(PartOfSpeech.VERB);
        } else {
            setPickerCategory(slot.type);
        }
    }
  };

  const handleAddNewClick = () => {
      if (validation || mergingIndex !== null) return;
      setIsAddingNew(true);
      setActiveSlotId(null);
      setCustomizingWord(null);
      setPickerCategory(PartOfSpeech.VERB); 
      scrollToPicker();
  };

  const handleRemoveSlot = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (validation || mergingIndex !== null) return;
      setSlots(prev => prev.filter(s => s.id !== id));
      if (activeSlotId === id) setActiveSlotId(null);
  };

  const handleInitialWordSelect = (word: Word) => {
      // If word is Noun or Adjective, open customizer
      if (word.type === PartOfSpeech.NOUN || word.type === PartOfSpeech.ADJECTIVE) {
          setCustomizingWord(word);
          const isFem = word.tags?.includes('f');
          setCustomGender(isFem ? 'f' : 'm');
          setCustomNumber('s');
      } 
      // If word is a Verb (Infinitive), open customizer for conjugations
      else if (word.type === PartOfSpeech.VERB_INF) {
          setCustomizingWord(word);
      }
      else {
          commitWordSelection(word);
      }
  };

  const commitWordSelection = (word: Word) => {
    if (activeSlotId) {
        setSlots(prev => prev.map(slot => 
            slot.id === activeSlotId ? { ...slot, value: word, type: word.type } : slot
        ));
        setActiveSlotId(null);
    } else if (isAddingNew) {
        const newSlot: SentenceSlot = {
            id: `slot-${Date.now()}-${Math.random()}`,
            type: word.type,
            value: word,
            placeholder: word.type
        };
        setSlots(prev => [...prev, newSlot]);
    }
    setCustomizingWord(null);
  };

  const handleConfirmVariation = () => {
      if (!customizingWord) return;
      const variedWord = generateVariations(customizingWord, customGender, customNumber);
      commitWordSelection(variedWord);
  };

  const handleCheckSentence = async () => {
    if (slots.length === 0) return;

    scrollToPicker(); // Ensure validation result is visible
    setIsValidating(true);
    
    // Auto-apply French Elision (Contractions) for valid string generation
    // Even if visual merge happened, this ensures text is clean.
    const sentenceStr = applyFrenchElision(slots.map(s => s.value?.text).join(' '));

    const topicForValidation = settings.topic === Topic.CUSTOM 
        ? `${Topic.CUSTOM}: ${settings.customTopic}` 
        : settings.topic;

    const result = await validateSentence(
        sentenceStr, 
        settings.tense, 
        topicForValidation as Topic,
        wordPool,
        activeChallenge,
        questionHistory // Pass history to prevent redundancy
    );
    
    setValidation(result);
    setIsValidating(false);
    setActiveSlotId(null);
    setIsAddingNew(false);
    setCustomizingWord(null);

    if (result.isValid) {
      const basePoints = 10 + (slots.length > 5 ? 5 : 0);
      const bonusPoints = activeChallenge ? 20 : 0;

      setGameState(prev => ({
        ...prev,
        score: prev.score + basePoints + bonusPoints,
        sentencesCompleted: prev.sentencesCompleted + 1,
        timeLeft: settings.mode === GameMode.BLITZ ? prev.timeLeft + (activeChallenge ? 15 : 10) : prev.timeLeft
      }));

      if (result.followUpQuestion) {
          setPendingChallenge(result.followUpQuestion);
          // Add to history so it isn't repeated immediately
          setQuestionHistory(prev => [...prev.slice(-9), result.followUpQuestion!]); // Keep last 10
      } else {
          setPendingChallenge(null);
      }
    }
  };

  const handleGetInspiration = async () => {
      setIsLoadingInspiration(true);
      const res = await generateInspiration(wordPool, settings.tense);
      setInspiration(res.englishSentence);
      setIsLoadingInspiration(false);
  }

  const handleNext = () => {
    setActiveChallenge(null);
    setPendingChallenge(null);

    if (settings.mode === GameMode.STANDARD && gameState.sentencesCompleted >= 10) {
      setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    } else {
      startNewRound();
    }
  };

  const handleAcceptChallenge = () => {
      if (!pendingChallenge) return;
      setActiveChallenge(pendingChallenge);
      setPendingChallenge(null);
      startNewRound(); 
  };

  // --- Filtering Logic for Sidebar and Grid ---
  
  // Logic to show words based on picker Category
  const getFilteredWords = () => {
      if (pickerCategory === PartOfSpeech.VERB) {
          // Special Logic: Show Infinitives of Verbs. 
          // Prioritize Auxiliaries (Avoir, Etre, Aller) at top.
          const verbs = wordPool.filter(w => w.type === PartOfSpeech.VERB_INF);
          
          const priority = ['avoir', 'être', 'aller'];
          return verbs.sort((a, b) => {
              const idxA = priority.indexOf(a.text.toLowerCase());
              const idxB = priority.indexOf(b.text.toLowerCase());
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.text.localeCompare(b.text);
          });
      }
      
      // Default behavior for other categories
      return wordPool.filter(w => w.type === pickerCategory).sort((a, b) => a.text.localeCompare(b.text));
  };
  
  const sortedWords = getFilteredWords();
  
  // Logic for Customizer Previews
  let previewVariation = null;
  let verbForms = null;

  if (customizingWord) {
      if (customizingWord.type === PartOfSpeech.VERB_INF) {
         verbForms = getVerbForms(customizingWord);
      } else if (customizingWord.type === PartOfSpeech.NOUN || customizingWord.type === PartOfSpeech.ADJECTIVE) {
         previewVariation = generateVariations(customizingWord, customGender, customNumber);
      }
  }

  // --- Loading View ---
  if (isLoadingWords) {
      return (
          <div className="min-h-screen bg-french-blue flex flex-col items-center justify-center p-8 text-white text-center">
              <SparklesIcon className="w-16 h-16 text-yellow-300 animate-spin mb-6" />
              <h2 className="text-3xl font-bold mb-2">Generating Vocabulary...</h2>
              <p className="text-xl opacity-80 max-w-md">Creating a custom word pack for <span className="font-bold text-yellow-300">"{settings.customTopic}"</span>.</p>
          </div>
      )
  }

  // --- Game Over View ---
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-honeycomb bg-fixed flex flex-col items-center justify-center p-8">
        <h1 className="text-5xl font-extrabold mb-4 animate-bounce-short text-french-blue">C'est Fini!</h1>
        <div className="bg-white text-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-8 border-honey-400">
          <p className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2">Total Score</p>
          <p className="text-6xl font-black text-french-blue mb-6">{gameState.score}</p>
          <button 
            onClick={onExit}
            className="w-full bg-french-red text-white py-3 rounded-lg font-bold hover:bg-red-600 transition shadow-lg clip-hex-btn"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-honeycomb bg-fixed flex flex-col font-sans">
      
      {/* Sticky Header Group: HUD + Sentence Builder */}
      <div className="sticky top-0 z-40 flex flex-col shadow-md transition-all duration-300">
          
          {/* HUD (Top Bar) */}
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center relative z-50 h-16">
            <div className="flex items-center gap-4 flex-1">
                <button onClick={onExit} className="text-gray-400 hover:text-gray-700 transition">
                    <HomeIcon className="w-6 h-6" />
                </button>
                <div className={`flex-col hidden md:flex ${isChallengeSticky ? 'opacity-0 md:opacity-100' : 'opacity-100'} transition-opacity duration-300`}>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{settings.mode}</span>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-honey-400 rotate-45"></span>
                        <span className="font-bold text-gray-800 max-w-[150px] truncate">{settings.topic === Topic.CUSTOM ? settings.customTopic : settings.topic}</span>
                    </div>
                </div>
            </div>

            {/* STICKY CHALLENGE TEXT: Appears in center/right when scrolled */}
            <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-500 transform w-full max-w-md justify-center
                ${isChallengeSticky ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                 <div className="bg-orange-500 text-white px-4 py-1.5 rounded-full shadow-md flex items-center gap-2 max-w-full">
                    <FireIcon className="w-4 h-4 text-yellow-200 shrink-0" />
                    <span className="font-serif font-bold italic truncate text-sm">{activeChallenge}</span>
                 </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
                {/* Inspiration Button */}
                {!activeChallenge && !validation && (
                    <button 
                        onClick={handleGetInspiration}
                        disabled={isLoadingInspiration || !!inspiration}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all
                            ${inspiration 
                                ? 'bg-indigo-100 text-indigo-500 cursor-default'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                            }
                            ${isLoadingInspiration ? 'opacity-50 cursor-wait' : ''}
                        `}
                        title="Need a sentence idea?"
                    >
                        <SparklesIcon className={`w-4 h-4 ${isLoadingInspiration ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{inspiration ? 'Inspiration Active' : 'Need Idea?'}</span>
                    </button>
                )}

                {settings.mode === GameMode.ZEN && (
                    <button 
                        onClick={() => setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }))}
                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-french-red transition uppercase tracking-wider mr-4"
                        title="Finish Session"
                    >
                        <FlagIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Finish</span>
                    </button>
                )}

                {settings.mode === GameMode.BLITZ && (
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${gameState.timeLeft <= 10 ? 'text-red-500 animate-pulse-fast' : 'text-gray-700'}`}>
                    <ClockIcon className="w-5 h-5" />
                    {gameState.timeLeft}s
                    </div>
                )}
                <div className="bg-gradient-to-r from-honey-400 to-honey-500 text-white px-4 py-1 font-bold shadow-md clip-hex-btn shrink-0">
                    {gameState.score} pts
                </div>
            </div>
          </div>
          
          {/* Inspiration Banner */}
          {inspiration && !activeChallenge && !validation && (
             <div className="bg-indigo-600 text-white text-center py-2 px-4 shadow-inner animate-fadeIn flex justify-center items-center gap-3 relative z-40">
                <SparklesIcon className="w-5 h-5 text-yellow-300" />
                <p className="font-medium text-sm md:text-base">
                    Try translating: <span className="font-bold font-serif italic ml-1">"{inspiration}"</span>
                </p>
                <button onClick={() => setInspiration(null)} className="absolute right-4 text-indigo-200 hover:text-white">
                    <XCircleIcon className="w-5 h-5" />
                </button>
             </div>
          )}

          {/* Persistent Sentence Slab */}
          <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 transition-all duration-300 overflow-x-auto flex-nowrap md:flex-wrap">
              <div className="max-w-6xl mx-auto w-full flex items-center justify-center gap-2 min-w-max md:min-w-0 px-2">
                {slots.map((slot, index) => (
                    <WordSlot 
                    key={slot.id} 
                    slot={slot} 
                    index={index}
                    isActive={slot.id === activeSlotId} 
                    isMerging={
                        mergingIndex !== null 
                        ? (index === mergingIndex ? 'left' : (index === mergingIndex + 1 ? 'right' : undefined))
                        : undefined
                    }
                    onClick={() => handleSlotClick(slot.id)}
                    onRemove={(e) => handleRemoveSlot(e, slot.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    />
                ))}
                
                {!validation && (
                    <button
                        onClick={handleAddNewClick}
                        className={`h-24 w-16 md:w-20 clip-hex-btn border-2 border-dashed flex-shrink-0 flex items-center justify-center transition-all duration-200
                        ${isAddingNew 
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-500 scale-105 shadow-md' 
                            : 'border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50'}
                        `}
                    >
                        <PlusIcon className="w-8 h-8" />
                    </button>
                )}
              </div>
          </div>
      </div>

      {/* Main Game Area (Scrollable) */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto w-full">
        
        {/* Hints / Challenge Info */}
        <div className="mt-4" ref={challengeRef}>
            {activeChallenge ? (
                <div className={`mb-6 w-full max-w-3xl transition-opacity duration-300 ${isChallengeSticky ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg border-2 border-orange-300 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                <FireIcon className="w-8 h-8 text-yellow-200 animate-pulse" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="uppercase tracking-widest font-black text-xs text-orange-100 mb-1">Challenge Active (+20pts)</h3>
                                <p className="text-xl md:text-2xl font-serif font-bold italic">"{activeChallenge}"</p>
                                <p className="text-sm opacity-80 mt-1">Build a response to this question.</p>
                            </div>
                        </div>
                        {/* Background deco */}
                        <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-white opacity-10 rotate-45"></div>
                    </div>
                </div>
            ) : (
                <div className="mb-6 flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-semibold border-l-4 border-yellow-400 shadow-sm">
                <LightBulbIcon className="w-4 h-4" />
                {getTenseHint(settings.tense)}
                </div>
            )}
        </div>

        {/* Interactive Picker & Customizer Container */}
        <div ref={pickerRef} className="w-full max-w-5xl min-h-[32rem] transition-all duration-300 relative scroll-mt-48">
          
          {/* Default Empty State */}
          {!activeSlotId && !isAddingNew && !validation && !isValidating && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-3xl bg-white/50 backdrop-blur-sm">
                <p className="font-medium">Click <span className="font-bold text-indigo-400">+</span> to add words.</p>
             </div>
          )}

          {/* Forge Animation during Validation */}
          {isValidating && <ForgeLoading slots={slots} />}

          {/* Word Picker */}
          {!isValidating && (activeSlotId || isAddingNew) && (
             <div className="bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col animate-fadeIn absolute inset-0 z-10 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                   <div>
                     <h3 className="text-lg font-extrabold text-gray-800">
                        {customizingWord ? 'Select Form' : (activeSlotId ? 'Change Word' : 'Add Word')}
                     </h3>
                   </div>
                   <button 
                     onClick={() => { setActiveSlotId(null); setIsAddingNew(false); setCustomizingWord(null); }} 
                     className="text-gray-300 hover:text-gray-500 transition"
                   >
                     <XCircleIcon className="w-8 h-8" />
                   </button>
                </div>
                
                {/* --- CUSTOMIZER VIEW (Verbs or Nouns/Adjectives) --- */}
                {customizingWord ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-indigo-50 to-white overflow-y-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-xl text-center my-auto">
                            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2 block">{customizingWord.type === PartOfSpeech.VERB_INF ? 'Verb' : customizingWord.type}</span>
                            <h2 className="text-4xl font-black text-french-blue mb-2">{customizingWord.text}</h2>
                            <p className="text-gray-500 italic mb-8">{customizingWord.translation}</p>
                            
                            {/* --- VERB CUSTOMIZER --- */}
                            {verbForms && (
                                <div className="mb-6">
                                    {/* Conjugation Grid */}
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Conjugations (Présent)</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                        {verbForms.conjugations.map((conj) => (
                                            <button
                                                key={conj.text}
                                                onClick={() => commitWordSelection(conj)}
                                                className="bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 p-3 rounded-lg text-center transition-all duration-200"
                                            >
                                                <span className="block text-xs text-gray-400 font-bold mb-1">{conj.tags?.[0] || '-'}</span>
                                                <span className="block font-bold text-gray-800">{conj.text}</span>
                                            </button>
                                        ))}
                                        {verbForms.conjugations.length === 0 && <p className="col-span-full text-gray-400 text-sm italic">Conjugations not available for this word yet.</p>}
                                    </div>
                                    
                                    {/* Infinitive & PP Options */}
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Other Forms</h4>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => commitWordSelection(verbForms!.inf)}
                                            className="px-6 py-3 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors"
                                        >
                                            Infinitive
                                            <span className="block text-xs font-normal opacity-70">({verbForms.inf.text})</span>
                                        </button>
                                        {verbForms.pp && (
                                            <button
                                                onClick={() => commitWordSelection(verbForms!.pp!)}
                                                className="px-6 py-3 rounded-lg border-2 border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors"
                                            >
                                                Past Participle
                                                <span className="block text-xs font-normal opacity-70">({verbForms.pp.text})</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- NOUN/ADJECTIVE CUSTOMIZER --- */}
                            {previewVariation && (
                                <>
                                    <h2 className="text-3xl font-black text-indigo-600 mb-6">{previewVariation.text}</h2>
                                    <div className="flex gap-4 mb-8 justify-center">
                                        {/* Number Toggle */}
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button 
                                                onClick={() => setCustomNumber('s')}
                                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${customNumber === 's' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Singular
                                            </button>
                                            <button 
                                                onClick={() => setCustomNumber('pl')}
                                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${customNumber === 'pl' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Plural
                                            </button>
                                        </div>

                                        {/* Gender Toggle - Only for Adjectives OR Mutable Nouns (like ami->amie) */}
                                        {(customizingWord.type === PartOfSpeech.ADJECTIVE || (customizingWord.type === PartOfSpeech.NOUN && customizingWord.tags?.includes('mutable'))) && (
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button 
                                                    onClick={() => setCustomGender('m')}
                                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${customGender === 'm' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Masc.
                                                </button>
                                                <button 
                                                    onClick={() => setCustomGender('f')}
                                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${customGender === 'f' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Fem.
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleConfirmVariation}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 clip-hex-btn"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Use Word
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <button onClick={() => setCustomizingWord(null)} className="mt-6 text-gray-400 hover:text-gray-600 underline text-sm flex-shrink-0">
                            Back to list
                        </button>
                    </div>
                ) : (
                /* --- MAIN PICKER VIEW --- */
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Categories Sidebar */}
                    <div className="w-24 md:w-40 bg-gray-50 overflow-y-auto border-r border-gray-100 flex-shrink-0">
                        {visibleCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setPickerCategory(cat)}
                                className={`w-full text-left px-3 py-2 text-xs md:text-sm font-bold border-l-4 transition-all duration-200
                                ${pickerCategory === cat 
                                    ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm' 
                                    : 'border-transparent text-gray-500 hover:bg-gray-100'}
                                `}
                            >
                                {getCategoryLabel(cat)}
                            </button>
                        ))}
                    </div>

                    {/* Words Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {sortedWords.map(word => (
                            <button
                            key={word.id}
                            onClick={() => handleInitialWordSelect(word)}
                            className="bg-gray-50 hover:bg-indigo-50 text-gray-800 border-2 border-transparent hover:border-indigo-300 p-3 text-center transition-all duration-200 flex flex-col items-center justify-center group hover:shadow-md min-h-[80px] clip-hex-btn"
                            >
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-base md:text-lg mb-1">{word.text}</span>
                                    {/* Show Gender Tag for Nouns */}
                                    {word.type === PartOfSpeech.NOUN && word.tags?.includes('f') && <span className="text-[10px] text-pink-400 font-bold bg-pink-50 px-1 rounded">f</span>}
                                    {word.type === PartOfSpeech.NOUN && word.tags?.includes('m') && <span className="text-[10px] text-blue-400 font-bold bg-blue-50 px-1 rounded">m</span>}
                                    
                                    {/* Show Aux Tag */}
                                    {word.text.includes('(Aux)') && <span className="text-[9px] text-amber-600 font-bold bg-amber-100 px-1 rounded">AUX</span>}
                                </div>
                                <span className="text-[10px] md:text-xs text-gray-400 group-hover:text-indigo-600 font-medium leading-tight">{word.translation}</span>
                                
                                <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                        {sortedWords.length === 0 && (
                            <div className="col-span-full flex items-center justify-center text-gray-400 py-12 italic">
                            No words available in this category.
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                )}
             </div>
          )}

          {/* Validation Result View */}
          {validation && (
             <div className={`absolute inset-0 z-20 rounded-3xl shadow-2xl border-4 p-8 flex flex-col animate-fadeIn bg-white ${validation.isValid ? 'border-green-400' : 'border-red-400'}`}>
                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-start gap-6 mb-6">
                        <div className={`p-4 rounded-full ${validation.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                            {validation.isValid 
                                ? <CheckCircleIcon className="w-10 h-10 text-green-600" /> 
                                : <XCircleIcon className="w-10 h-10 text-red-600" />
                            }
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-2xl font-black mb-2 ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                                {validation.isValid ? (activeChallenge ? "Challenge Complete!" : "Magnifique!") : "Oups"}
                            </h3>
                            <p className="text-gray-700 text-lg leading-relaxed">
                                {validation.explanation}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meaning</span>
                            <p className="text-xl text-gray-800 font-serif italic">"{validation.translation}"</p>
                        </div>
                        
                        {!validation.isValid && validation.correction !== slots.map(s => s.value?.text).join(' ') && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Correction</span>
                                <p className="text-lg text-red-700 font-bold">{validation.correction}</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Challenge Offer Section */}
                    {validation.isValid && pendingChallenge && (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden border border-gray-700">
                             <div className="relative z-10">
                                <h4 className="flex items-center gap-2 text-yellow-400 font-black uppercase tracking-widest text-sm mb-2">
                                    <FireIcon className="w-5 h-5" />
                                    Bonus Challenge (+20 pts)
                                </h4>
                                <p className="text-xl font-serif italic mb-2">"{pendingChallenge}"</p>
                                <p className="text-gray-400 text-sm">Accept to reply to this question in the next round.</p>
                             </div>
                             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500 opacity-10 rounded-full blur-2xl"></div>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>

      </main>

      {/* Footer Controls */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="max-w-5xl mx-auto flex justify-center w-full">
            {!validation ? (
               <button 
                 onClick={handleCheckSentence}
                 disabled={isValidating || slots.length < 2}
                 className={`
                    w-full max-w-md py-4 clip-hex-btn font-bold text-xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 transform
                    ${slots.length < 2 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : 'bg-french-blue text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl active:scale-95'}
                 `}
               >
                 {isValidating ? (
                   <>
                     {/* No icon needed here, the main animation is in the center */}
                     Verifying...
                   </>
                 ) : (
                   activeChallenge ? "Submit Answer" : "Check Grammar"
                 )}
               </button>
            ) : (
                // Footer buttons when validation is showing
                <div className="flex gap-4 w-full max-w-md">
                     {validation.isValid && pendingChallenge && (
                         <button
                            onClick={handleAcceptChallenge}
                            className="flex-1 py-4 clip-hex-btn font-bold text-lg shadow-lg bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                         >
                             <FireIcon className="w-5 h-5" />
                             Accept
                         </button>
                     )}
                     
                     <button 
                        onClick={handleNext}
                        className={`flex-1 py-4 clip-hex-btn font-bold text-lg shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2
                        ${validation.isValid && pendingChallenge ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-900 text-white hover:bg-black'}
                        `}
                    >
                        <span>{validation.isValid && pendingChallenge ? "Decline" : "Next Sentence"}</span>
                        {!pendingChallenge && <span className="text-gray-400 text-sm font-normal">(Enter)</span>}
                    </button>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};