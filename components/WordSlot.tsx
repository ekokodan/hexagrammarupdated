import React, { useEffect, useState } from 'react';
import { PartOfSpeech, SentenceSlot } from '../types';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface WordSlotProps {
  slot: SentenceSlot;
  index: number;
  isActive: boolean;
  isMerging?: 'left' | 'right'; // Prop to trigger merge animation
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

const getSlotColor = (type: PartOfSpeech) => {
  switch (type) {
    case PartOfSpeech.SUBJECT: return 'bg-blue-100 border-blue-300 text-blue-800';
    case PartOfSpeech.VERB: return 'bg-red-100 border-red-300 text-red-800';
    case PartOfSpeech.VERB_AUX: return 'bg-pink-100 border-pink-300 text-pink-800';
    case PartOfSpeech.VERB_INF: return 'bg-orange-100 border-orange-300 text-orange-800';
    case PartOfSpeech.VERB_PP: return 'bg-rose-100 border-rose-300 text-rose-800';
    case PartOfSpeech.NOUN: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case PartOfSpeech.ADJECTIVE: return 'bg-green-100 border-green-300 text-green-800';
    case PartOfSpeech.ARTICLE: return 'bg-purple-100 border-purple-300 text-purple-800';
    case PartOfSpeech.POSSESSIVE: return 'bg-cyan-100 border-cyan-300 text-cyan-800';
    case PartOfSpeech.PREPOSITION: return 'bg-indigo-100 border-indigo-300 text-indigo-800';
    case PartOfSpeech.CONNECTOR: return 'bg-teal-100 border-teal-300 text-teal-800';
    case PartOfSpeech.NEGATION: return 'bg-gray-700 border-gray-900 text-white'; // distinctive look for negation
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getSlotLabel = (type: PartOfSpeech) => {
    switch (type) {
        case PartOfSpeech.SUBJECT: return 'Sujet';
        case PartOfSpeech.VERB: return 'Verbe';
        case PartOfSpeech.VERB_AUX: return 'Aux.';
        case PartOfSpeech.VERB_INF: return 'Infinitif';
        case PartOfSpeech.VERB_PP: return 'Participe';
        case PartOfSpeech.NOUN: return 'Nom';
        case PartOfSpeech.ADJECTIVE: return 'Adj.';
        case PartOfSpeech.ARTICLE: return 'Art.';
        case PartOfSpeech.POSSESSIVE: return 'Poss.';
        case PartOfSpeech.PREPOSITION: return 'Prép.';
        case PartOfSpeech.CONNECTOR: return 'Lien';
        case PartOfSpeech.NEGATION: return 'Nég.';
        default: return type;
      }
}

export const WordSlot: React.FC<WordSlotProps> = ({ 
    slot, 
    index, 
    isActive, 
    isMerging,
    onClick, 
    onRemove,
    onDragStart,
    onDragOver,
    onDrop
}) => {
  const [isNewMerged, setIsNewMerged] = useState(false);

  useEffect(() => {
      // Check if this slot was just created via merge (heuristic: contains '+' in id)
      if (slot.value?.id.includes('+')) {
          setIsNewMerged(true);
          const t = setTimeout(() => setIsNewMerged(false), 500);
          return () => clearTimeout(t);
      }
  }, [slot.id]);

  const baseClasses = "relative h-24 min-w-[70px] md:min-w-[90px] flex flex-col items-center justify-center border-b-4 cursor-grab active:cursor-grabbing transition-all duration-200 select-none shadow-sm hover:-translate-y-1 hover:shadow-md active:translate-y-0 group clip-hex-btn";
  const colorClasses = slot.value ? getSlotColor(slot.type) : "bg-white border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 hover:border-gray-400";
  const activeClasses = isActive ? "ring-4 ring-indigo-200 scale-105 z-10 shadow-xl" : "";
  
  // Animation States
  const mergeClasses = isMerging 
    ? (isMerging === 'left' ? 'animate-merge-right z-20' : 'animate-merge-left z-20')
    : '';
    
  const bornClasses = isNewMerged ? 'animate-pop-in' : '';

  return (
    <>
    <style>{`
        @keyframes mergeRight {
            0% { transform: translateX(0) scale(1); opacity: 1; }
            100% { transform: translateX(50%) scale(0.5); opacity: 0; }
        }
        @keyframes mergeLeft {
            0% { transform: translateX(0) scale(1); opacity: 1; }
            100% { transform: translateX(-50%) scale(0.5); opacity: 0; }
        }
        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); }
        }
        .animate-merge-right {
            animation: mergeRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            border-color: #FCD34D !important; /* Gold border during merge */
            background-color: #FEF3C7 !important;
        }
        .animate-merge-left {
            animation: mergeLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            border-color: #FCD34D !important;
            background-color: #FEF3C7 !important;
        }
        .animate-pop-in {
            animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
    `}</style>
    <div 
      onClick={onClick}
      draggable={true}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className={`${baseClasses} ${colorClasses} ${activeClasses} ${mergeClasses} ${bornClasses} px-1 mx-1 flex-grow md:flex-grow-0`}
    >
      {/* Delete Badge */}
      {!isMerging && (
        <div 
            role="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm z-20 rounded-bl-lg"
            title="Remove word"
        >
            <XMarkIcon className="w-3 h-3" />
        </div>
      )}

      {slot.value ? (
        <>
           <span className="text-[9px] uppercase font-bold opacity-60 mb-1 tracking-wider pointer-events-none">{getSlotLabel(slot.type)}</span>
           <span className="text-sm md:text-xl font-bold text-center leading-tight break-all px-1 pointer-events-none">{slot.value.text}</span>
           <span className="text-[9px] italic opacity-50 mt-1 max-w-full truncate px-1 pointer-events-none">{slot.value.translation}</span>
        </>
      ) : (
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-center pointer-events-none">{getSlotLabel(slot.type)}</span>
      )}
      
      {/* Connector line effect for empty slots */}
      {!slot.value && (
          <div className="absolute -bottom-1 left-0 right-0 mx-auto w-1/3 h-1 bg-gray-200 pointer-events-none"></div>
      )}
    </div>
    </>
  );
};