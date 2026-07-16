import React from 'react';
import { Card } from '../types';
import { Check, Shield, Zap, Sparkles, Flame, Droplets, Leaf, Circle, Key, ArrowUp, ArrowDown, Pencil, Trash2, ZoomIn } from 'lucide-react';

interface TCGCardProps {
  card: Card;
  possession: Record<string, boolean>;
  onToggle: (variant: string) => void;
  isEditMode?: boolean;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isLightMode?: boolean;
  isEditing?: boolean;
  onSave?: (updatedCard: Card) => void;
  onCancel?: () => void;
}

export const TCGCard: React.FC<TCGCardProps> = ({ 
  card, 
  possession, 
  onToggle,
  isEditMode = false,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp = false,
  canMoveDown = false,
  isLightMode = false,
  isEditing = false,
  onSave,
  onCancel
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isZoomed, setIsZoomed] = React.useState(false);

  // States for inline edit form
  const [editNom, setEditNom] = React.useState(card.nom);
  const [editNumero, setEditNumero] = React.useState(card.numero);
  const [editSet, setEditSet] = React.useState(card.set);
  const [editLangue, setEditLangue] = React.useState(card.langue);
  const [editImage, setEditImage] = React.useState(card.image || '');
  const [editRarete, setEditRarete] = React.useState(card.rarete);
  const [editVariantesStr, setEditVariantesStr] = React.useState(card.variantes.join(', '));

  React.useEffect(() => {
    if (isEditing) {
      setEditNom(card.nom);
      setEditNumero(card.numero);
      setEditSet(card.set);
      setEditLangue(card.langue);
      setEditImage(card.image || '');
      setEditRarete(card.rarete);
      setEditVariantesStr(card.variantes.join(', '));
    }
  }, [card, isEditing]);

  // Helper to get resolved image URL
  const getResolvedImage = (): string => {
    if (!card.image) return '';

    // If it starts with data:, it's base64 (already perfect)
    if (card.image.startsWith('data:')) {
      return card.image;
    }

    // Dragon Ball live URL resolution
    if (card.numero.includes('FB') || card.set.toLowerCase().includes('fb')) {
      if (card.image.startsWith('/cards/')) {
        return `https://www.dbs-cardgame.com/fw/images/cardlist/card/${card.numero}.png`;
      }
    }

    // Pokemon live URL resolution via global lookup if loaded, or custom fallback
    if (card.image.startsWith('/cards/pokemon/')) {
      // 1. Try global window lookup first (extremely complete)
      const lookup = (window as any).tcgImageLookup;
      if (lookup) {
        const nameKey = card.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        let numKey = card.numero.split('/')[0].trim();
        if (/^\d+$/.test(numKey)) {
          numKey = parseInt(numKey, 10).toString();
        }
        numKey = numKey.toLowerCase();
        
        const mappedImage = lookup[`${nameKey}::${numKey}`];
        if (mappedImage) {
          return mappedImage;
        }
      }

      // 2. Custom dictionary of set codes fallback if lookup hasn't finished loading
      const setMap: Record<string, string> = {
        'xy - poing furieux': 'xy3',
        'xy - offensive vapeur': 'xy11',
        'soleil & lune - duo de choc': 'sm9',
        'épée & bouclier - voltage éclatant': 'swsh4'
      };
      const normalizedSet = card.set.toLowerCase();
      const setKey = Object.keys(setMap).find(k => normalizedSet.includes(k));
      if (setKey) {
        const setId = setMap[setKey];
        const numOnly = card.numero.split('/')[0].trim().replace(/^0+/, '');
        const series = setId.replace(/\d+$/, '');
        return `https://assets.tcgdex.net/fr/${series}/${setId}/${numOnly}/low.png`;
      }
    }

    return card.image;
  };

  const resolvedImage = getResolvedImage();

  React.useEffect(() => {
    setImageError(false);
  }, [resolvedImage]);

  const hasValidImage = resolvedImage && 
                        !imageError && 
                        resolvedImage.trim() !== '';

  // Determine card type for custom styling
  const getCardTypeAndColors = () => {
    const name = card.nom.toLowerCase();
    const set = card.set.toLowerCase();

    // Check Dragon Ball first
    if (set.includes('fb04') || set.includes('fb09') || card.numero.includes('FB')) {
      const isLeader = card.rarete.toLowerCase() === 'leader';
      const isScr = card.rarete.toLowerCase() === 'scr';

      if (isScr) {
        return {
          type: 'db-scr',
          bg: isLightMode 
            ? 'bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-100 text-zinc-950' 
            : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 text-white',
          border: isLightMode 
            ? 'border-pink-300 shadow-[0_2px_12px_rgba(236,72,153,0.15)]' 
            : 'border-pink-500/80 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
          badge: 'bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold',
          icon: <Sparkles className="w-4 h-4 text-yellow-300" />,
          glow: 'from-pink-500/30 via-purple-500/30 to-yellow-500/30'
        };
      }

      // Check DB Colors in names or cards
      if (name.includes('goku') || name.includes('gohan') || name.includes('bardock') || name.includes('jiren') || name.includes('toppo')) {
        return {
          type: 'db-red',
          bg: isLightMode 
            ? 'bg-gradient-to-br from-red-50/70 via-white to-white text-zinc-950' 
            : 'bg-gradient-to-br from-red-950 via-neutral-900 to-neutral-950 text-white',
          border: isLightMode 
            ? 'border-red-200 shadow-[0_2px_10px_rgba(220,38,38,0.06)]' 
            : 'border-red-600/50 shadow-[0_0_12px_rgba(220,38,38,0.2)]',
          badge: isLightMode 
            ? 'bg-red-50 text-red-600 border border-red-200' 
            : 'bg-red-600/20 text-red-300 border border-red-500/30',
          icon: <Flame className="w-4 h-4 text-red-500" />,
          glow: 'from-red-600/20 to-transparent'
        };
      }
      if (name.includes('vegeta') || name.includes('trunks') || name.includes('bulma') || name.includes('beerus') || name.includes('whis') || name.includes('poisson')) {
        return {
          type: 'db-blue',
          bg: isLightMode 
            ? 'bg-gradient-to-br from-blue-50/70 via-white to-white text-zinc-950' 
            : 'bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-950 text-white',
          border: isLightMode 
            ? 'border-blue-200 shadow-[0_2px_10px_rgba(59,130,246,0.06)]' 
            : 'border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
          badge: isLightMode 
            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
            : 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
          icon: <Droplets className="w-4 h-4 text-blue-400" />,
          glow: 'from-blue-600/20 to-transparent'
        };
      }
      if (name.includes('broly') || name.includes('paragus') || name.includes('cell') || name.includes('c-17')) {
        return {
          type: 'db-green',
          bg: isLightMode 
            ? 'bg-gradient-to-br from-emerald-50/70 via-white to-white text-zinc-950' 
            : 'bg-gradient-to-br from-emerald-950 via-neutral-900 to-neutral-950 text-white',
          border: isLightMode 
            ? 'border-emerald-200 shadow-[0_2px_10px_rgba(16,185,129,0.06)]' 
            : 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          badge: isLightMode 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30',
          icon: <Leaf className="w-4 h-4 text-emerald-400" />,
          glow: 'from-emerald-600/20 to-transparent'
        };
      }
      // Yellow as default
      return {
        type: 'db-yellow',
        bg: isLightMode 
          ? 'bg-gradient-to-br from-amber-50/70 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-br from-amber-950 via-neutral-900 to-neutral-950 text-white',
        border: isLightMode 
          ? 'border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.06)]' 
          : 'border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        badge: isLightMode 
          ? 'bg-amber-50 text-amber-600 border border-amber-200' 
          : 'bg-amber-600/20 text-amber-300 border border-amber-500/30',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        glow: 'from-amber-600/20 to-transparent'
      };
    }

    // Pokémon Elemental Types
    const isFire = name.includes('dracaufeu') || name.includes('salamèche') || name.includes('reptincel') || name.includes('pyroli') || name.includes('braségali') || name.includes('poussifeu') || name.includes('galifeu');
    const isWater = name.includes('carapuce') || name.includes('carabaffe') || name.includes('tortank') || name.includes('psykokwak') || name.includes('laggron') || name.includes('gobou') || name.includes('flobio') || name.includes('aquali');
    const isGrass = name.includes('bulbizarre') || name.includes('herbizarre') || name.includes('florizarre') || name.includes('arcko') || name.includes('massko') || name.includes('jungko');
    const isElectric = name.includes('pikachu') || name.includes('raichu') || name.includes('voltali');
    const isPsychic = name.includes('mewtwo') || name.includes('tarsal') || name.includes('kirlia') || name.includes('gardevoir') || name.includes('mélofée') || name.includes('mélodelfe');
    const isCombat = name.includes('brutalibré') || name.includes('lucario') || name.includes('gallame');
    const isMetal = name.includes('tarinorme') || name.includes('metalosse') || name.includes('terhal') || name.includes('metang');

    if (isFire) {
      return {
        type: 'Feu',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-orange-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-red-950 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-red-200 shadow-[0_2px_8px_rgba(239,68,68,0.05)]' 
          : 'border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
        badge: isLightMode 
          ? 'bg-red-50 text-red-600 border border-red-200' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30',
        icon: <Flame className="w-4 h-4 text-red-500" />,
        glow: 'from-red-500/20 to-transparent'
      };
    }
    if (isWater) {
      return {
        type: 'Eau',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-sky-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-blue-950 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-blue-200 shadow-[0_2px_8px_rgba(59,130,246,0.05)]' 
          : 'border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
        badge: isLightMode 
          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        icon: <Droplets className="w-4 h-4 text-blue-500" />,
        glow: 'from-blue-500/20 to-transparent'
      };
    }
    if (isGrass) {
      return {
        type: 'Plante',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-emerald-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-green-950 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-green-200 shadow-[0_2px_8px_rgba(34,197,94,0.05)]' 
          : 'border-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.15)]',
        badge: isLightMode 
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
          : 'bg-green-500/20 text-green-400 border border-green-500/30',
        icon: <Leaf className="w-4 h-4 text-green-500" />,
        glow: 'from-green-500/20 to-transparent'
      };
    }
    if (isElectric) {
      return {
        type: 'Électrik',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-yellow-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-yellow-950/40 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-yellow-200 shadow-[0_2px_8px_rgba(234,179,8,0.05)]' 
          : 'border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]',
        badge: isLightMode 
          ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' 
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        icon: <Zap className="w-4 h-4 text-yellow-500" />,
        glow: 'from-yellow-500/20 to-transparent'
      };
    }
    if (isPsychic) {
      return {
        type: 'Psy',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-purple-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-purple-950/80 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-purple-200 shadow-[0_2px_8px_rgba(168,85,247,0.05)]' 
          : 'border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
        badge: isLightMode 
          ? 'bg-purple-50 text-purple-600 border border-purple-200' 
          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        icon: <Sparkles className="w-4 h-4 text-purple-500" />,
        glow: 'from-purple-500/20 to-transparent'
      };
    }
    if (isCombat) {
      return {
        type: 'Combat',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-orange-50/80 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-orange-950 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-orange-200 shadow-[0_2px_8px_rgba(249,115,22,0.05)]' 
          : 'border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
        badge: isLightMode 
          ? 'bg-orange-50 text-orange-600 border border-orange-200' 
          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        icon: <Shield className="w-4 h-4 text-orange-500" />,
        glow: 'from-orange-500/20 to-transparent'
      };
    }
    if (isMetal) {
      return {
        type: 'Métal',
        bg: isLightMode 
          ? 'bg-gradient-to-b from-slate-50 via-white to-white text-zinc-950' 
          : 'bg-gradient-to-b from-slate-800 via-zinc-900 to-zinc-950 text-white',
        border: isLightMode 
          ? 'border-slate-200 shadow-[0_2px_8px_rgba(148,163,184,0.05)]' 
          : 'border-slate-500/60 shadow-[0_0_10px_rgba(148,163,184,0.15)]',
        badge: isLightMode 
          ? 'bg-slate-50 text-slate-600 border border-slate-200' 
          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
        icon: <Shield className="w-4 h-4 text-slate-400" />,
        glow: 'from-slate-500/20 to-transparent'
      };
    }

    // Default Normal/Colorless
    return {
      type: 'Normal',
      bg: isLightMode 
        ? 'bg-gradient-to-b from-zinc-50 via-zinc-100/50 to-white text-zinc-950' 
        : 'bg-gradient-to-b from-neutral-800 via-zinc-900 to-zinc-950 text-white',
      border: isLightMode 
        ? 'border-zinc-200 shadow-sm' 
        : 'border-neutral-600/60 shadow-md',
      badge: isLightMode 
        ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' 
        : 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30',
      icon: <Circle className="w-4 h-4 text-neutral-400" />,
      glow: 'from-neutral-500/10 to-transparent'
    };
  };

  const style = getCardTypeAndColors();

  // Highlight special cards (EX, Alternative, Holo, Leader, SCR) with holographic effects
  const isSpecial = 
    card.rarete.toLowerCase() === 'ex' ||
    card.rarete.toLowerCase() === 'scr' ||
    card.rarete.toLowerCase() === 'leader' ||
    card.rarete.toLowerCase().includes('alternative') ||
    card.rarete.toLowerCase().includes('spéciale') ||
    card.rarete.toLowerCase().includes('illustration');

  // Total variants possessed for this specific card
  const ownedCount = card.variantes.filter(v => possession[`${card.set}::${card.numero}::${v}`]).length;
  const totalCount = card.variantes.length;
  const isFullyOwned = ownedCount === totalCount;
  const isPartiallyOwned = ownedCount > 0 && ownedCount < totalCount;

  // Custom visual illustration fallback inside the card
  const renderCardIllustration = () => {
    const nameLower = card.nom.toLowerCase();
    
    // Brutalibré (Hawlucha) - Dynamic bird warrior silhouette
    if (nameLower.includes('brutalibré')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-400 opacity-60">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M50,15 L62,35 L80,30 L65,48 L75,70 L50,60 L25,70 L35,48 L20,30 L38,35 Z" fill="currentColor" fillRule="evenodd" />
          <polygon points="50,10 55,25 45,25" fill="#f97316" />
          <circle cx="50" cy="45" r="8" fill="#1e1e1e" />
          <circle cx="50" cy="45" r="4" fill="#facc15" />
        </svg>
      );
    }
    // Tarinorme (Probopass) - Rock monolith with large magnetic nose
    if (nameLower.includes('tarinorme')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400 opacity-60">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          {/* Eyes */}
          <ellipse cx="38" cy="35" rx="5" ry="8" fill="#38bdf8" />
          <ellipse cx="62" cy="35" rx="5" ry="8" fill="#38bdf8" />
          {/* Stone Body */}
          <path d="M30,20 L70,20 Q80,50 70,80 L30,80 Q20,50 30,20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Large Red Nose */}
          <path d="M42,40 L58,40 L62,65 Q50,75 38,65 Z" fill="#ef4444" />
          {/* Mustache (Magnetic metal filings) */}
          <path d="M25,72 Q50,62 75,72 Q50,85 25,72" fill="#1e293b" />
        </svg>
      );
    }
    // Psykokwak (Psyduck) - Confused duck holding head
    if (nameLower.includes('psykokwak')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-500 opacity-60">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          {/* Round head */}
          <circle cx="50" cy="45" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Eyes with small dots */}
          <circle cx="42" cy="42" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="42" cy="42" r="1" fill="currentColor" />
          <circle cx="58" cy="42" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="58" cy="42" r="1" fill="currentColor" />
          {/* Beak */}
          <path d="M43,48 Q50,42 57,48 Q50,56 43,48 Z" fill="#fbbf24" stroke="currentColor" strokeWidth="1" />
          {/* Hands holding head */}
          <path d="M25,48 Q35,42 32,35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M75,48 Q65,42 68,35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* Three hairs */}
          <path d="M50,23 L50,15 M48,23 L44,16 M52,23 L56,16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    }
    
    // Dragon Ball themed illustration
    if (card.numero.includes('FB')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500 opacity-50">
          {/* Dragon Ball Star */}
          <polygon points="50,15 54,30 70,30 57,40 62,55 50,45 38,55 43,40 30,30 46,30" fill="currentColor" />
          {/* Circular frame aura */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4" />
          <path d="M15,50 Q50,10 85,50 Q50,90 15,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse" />
        </svg>
      );
    }

    // Default PokeBall style for general pokemon fullset cards
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-500 opacity-45">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="50" r="15" fill="#1e1e1e" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="50" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  };

  if (isEditing) {
    return (
      <div className={`flex flex-col w-full rounded-2xl border-2 p-3.5 gap-2.5 transition-all duration-300 ${
        isLightMode ? 'bg-white border-indigo-400' : 'bg-[#121215] border-indigo-500/50'
      }`}>
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/20">
          <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Modifier la carte</span>
          <button 
            type="button" 
            onClick={onCancel}
            className={`text-[10px] font-bold ${isLightMode ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
          >
            Annuler
          </button>
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500">Nom de la carte</label>
            <input
              type="text"
              value={editNom}
              onChange={(e) => setEditNom(e.target.value)}
              className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500">Numéro</label>
              <input
                type="text"
                value={editNumero}
                onChange={(e) => setEditNumero(e.target.value)}
                className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500">Rareté</label>
              <input
                type="text"
                value={editRarete}
                onChange={(e) => setEditRarete(e.target.value)}
                className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500">Série (Set)</label>
              <input
                type="text"
                value={editSet}
                onChange={(e) => setEditSet(e.target.value)}
                className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-zinc-500">Langue</label>
              <select
                value={editLangue}
                onChange={(e) => setEditLangue(e.target.value)}
                className={`w-full text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                }`}
              >
                <option value="FR">FR</option>
                <option value="JP">JP</option>
                <option value="EN">EN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500">Image URL</label>
            <input
              type="text"
              value={editImage}
              onChange={(e) => setEditImage(e.target.value)}
              placeholder="https://..."
              className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            />
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500">Variantes</label>
            <input
              type="text"
              value={editVariantesStr}
              onChange={(e) => setEditVariantesStr(e.target.value)}
              placeholder="normal, holo, reverse"
              className={`w-full text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSave?.({
              ...card,
              nom: editNom.trim(),
              numero: editNumero.trim(),
              set: editSet.trim(),
              langue: editLangue.trim(),
              image: editImage.trim(),
              rarete: editRarete.trim(),
              variantes: editVariantesStr.split(',').map(v => v.trim()).filter(Boolean)
            });
          }}
          className="w-full py-1.5 mt-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
        >
          Enregistrer
        </button>
      </div>
    );
  }

  return (
    <div 
      id={`card-${card.set.replace(/\s+/g, '-')}-${card.numero.replace('/', '-')}`}
      className={`relative flex flex-col w-full rounded-2xl border-2 transition-all duration-300 overflow-hidden ${style.bg} ${
        isFullyOwned 
          ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
          : isPartiallyOwned 
            ? 'border-yellow-500/60 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
            : style.border
      }`}
    >
      {/* Edit mode top action bar */}
      {isEditMode && (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-950/50 border-b border-indigo-500/30 text-xs text-indigo-300 font-semibold z-20">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Gérer la carte</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!canMoveUp}
              className="p-1 rounded bg-black/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Monter"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!canMoveDown}
              className="p-1 rounded bg-black/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Descendre"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="p-1 rounded bg-indigo-600/30 text-indigo-300 hover:text-white hover:bg-indigo-600/60 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-1 rounded bg-red-950/60 text-red-400 hover:text-white hover:bg-red-900/60 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Top Foil Shine Overlay for Special Cards */}
      {isSpecial && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent mix-blend-overlay opacity-40 z-10 animate-pulse" />
      )}

      {/* Holographic glowing borders for very rare cards */}
      {isSpecial && (
        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${style.glow} opacity-40 blur-sm pointer-events-none -z-10`} />
      )}

      {/* Card Header */}
      <div className={`flex items-center justify-between px-4 pt-3.5 pb-2 border-b z-10 ${isLightMode ? 'border-zinc-200/50' : 'border-white/5'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-sans font-semibold text-sm tracking-tight truncate max-w-[150px] ${isLightMode ? 'text-zinc-900' : 'text-white/95'}`}>
              {card.nom}
            </span>
            {isSpecial && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <span className={`font-mono text-[10px] font-medium ${isLightMode ? 'text-zinc-500' : 'text-white/40'}`}>
            {card.set}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded border ${
            isLightMode 
              ? 'bg-zinc-100 text-zinc-700 border-zinc-200' 
              : 'bg-white/5 text-white/60 border-white/10'
          }`}>
            {card.numero}
          </span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
            isLightMode 
              ? 'bg-zinc-100 text-zinc-700 border-zinc-200' 
              : 'bg-black/40 text-neutral-300 border-neutral-700/50'
          }`}>
            {card.langue}
          </span>
        </div>
      </div>

      {/* Card Graphic/Illustration Section */}
      <div className={`relative flex items-center justify-center h-44 px-3 py-2 select-none overflow-hidden group ${
        isLightMode ? 'bg-zinc-50/70' : 'bg-black/35'
      }`}>
        {/* Abstract Background Design based on element */}
        <div className={`absolute inset-0 bg-radial-gradient from-transparent ${
          isLightMode ? 'to-zinc-200/30' : 'to-black/60'
        } opacity-60`} />
        
        {/* Dynamic Styled SVG Illustration or Real Image */}
        <div 
          onClick={() => { if (hasValidImage) setIsZoomed(true); }}
          className={`w-full h-full max-h-40 flex items-center justify-center relative transition-transform duration-500 group-hover:scale-105 ${hasValidImage ? 'cursor-zoom-in' : ''}`}
        >
          {hasValidImage ? (
            <img 
              src={resolvedImage} 
              alt={card.nom} 
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded-lg shadow-md" 
            />
          ) : (
            renderCardIllustration()
          )}
        </div>

        {/* Floating Zoom Icon Option */}
        {hasValidImage && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }}
            className={`absolute top-2 left-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all border ${
              isLightMode 
                ? 'bg-white/80 text-zinc-700 hover:text-black hover:bg-white border-zinc-200' 
                : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80 border-white/10'
            }`}
            title="Agrandir l'image"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick status pill inside the illustration frame */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
            isFullyOwned 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : isPartiallyOwned 
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                : isLightMode
                  ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50'
          }`}>
            {isFullyOwned ? 'Possédé' : isPartiallyOwned ? 'En cours' : 'Manquant'}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${style.badge}`}>
            {style.icon}
            <span className="font-medium text-[10px]">{card.rarete}</span>
          </span>
        </div>
      </div>

      {/* Card Checkbox Tracking Panel */}
      <div className={`flex flex-col p-3.5 gap-2 border-t z-10 ${
        isLightMode ? 'bg-zinc-50/50 border-t border-zinc-100' : 'bg-black/20 border-t border-white/5'
      }`}>
        <span className={`text-[10px] uppercase tracking-wider font-bold ${
          isLightMode ? 'text-zinc-400' : 'text-neutral-400'
        }`}>
          Variantes disponibles :
        </span>

        <div className="grid grid-cols-1 gap-1.5">
          {card.variantes.map((variant) => {
            const variantKey = `${card.set}::${card.numero}::${variant}`;
            const isOwned = !!possession[variantKey];

            return (
              <button
                key={variant}
                id={`btn-toggle-${card.set.replace(/\s+/g, '-')}-${card.numero.replace('/', '-')}-${variant}`}
                onClick={() => onToggle(variant)}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold select-none transition-all duration-200 active:scale-[0.98] ${
                  isOwned
                    ? isLightMode
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.08)]'
                      : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.1)]'
                    : isLightMode
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/80 hover:border-zinc-300 active:bg-zinc-100'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-neutral-300 hover:border-zinc-700 active:bg-zinc-800/80'
                }`}
              >
                <span className="capitalize flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all duration-200 ${
                    isOwned 
                      ? isLightMode
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-emerald-500 border-emerald-400 text-black' 
                      : isLightMode
                        ? 'border-zinc-300 bg-white'
                        : 'border-zinc-700 bg-black/40'
                  }`}>
                    {isOwned && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  {variant}
                </span>

                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isOwned 
                    ? isLightMode
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-emerald-500/20 text-emerald-400' 
                    : isLightMode
                      ? 'bg-zinc-100 text-zinc-500'
                      : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {isOwned ? 'Possédé' : 'Manquant'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Zoom Lightbox Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-full max-h-[85vh] flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
            <img 
              src={resolvedImage} 
              alt={card.nom} 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div className="text-center bg-black/40 backdrop-blur-md py-2.5 px-4 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold text-base">{card.nom}</h3>
              <p className="text-zinc-400 text-xs mt-0.5">{card.set} — N° {card.numero}</p>
            </div>
            <button 
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors font-bold text-xs"
              onClick={() => setIsZoomed(false)}
            >
              Fermer [X]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
