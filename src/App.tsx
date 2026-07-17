import React, { useState, useEffect, FormEvent } from 'react';
import { Card, Category, SubCategory, PossessionState } from './types';
import { ALL_DATA, SECTION_LABELS } from './data/loader';
import { TCGCard } from './components/TCGCard';
import { 
  ChevronLeft, 
  Search, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Zap, 
  Award,
  Filter,
  CheckCircle,
  TrendingUp,
  FolderHeart,
  Home,
  Check,
  SlidersHorizontal,
  Plus,
  X,
  Database,
  Download
} from 'lucide-react';

const extractCardNumberForSorting = (numero: string): number => {
  if (!numero) return 99999;
  // If the number contains a slash (e.g. 063/111), take the left side
  if (numero.includes('/')) {
    const leftPart = numero.split('/')[0].trim();
    const digits = leftPart.match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
  }
  // If it contains a hyphen (e.g. FB04-001), take the right side
  if (numero.includes('-')) {
    const parts = numero.split('-');
    const rightPart = parts[parts.length - 1].trim();
    const digits = rightPart.match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
  }
  // Otherwise, match any digits
  const digits = numero.match(/\d+/);
  if (digits) return parseInt(digits[0], 10);
  return 99999;
};

const PokeballIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="50" cy="50" r="43" />
    <line x1="7" y1="50" x2="93" y2="50" />
    <circle cx="50" cy="50" r="14" fill="currentColor" />
    <circle cx="50" cy="50" r="5" fill="white" />
  </svg>
);

const DragonBallOneStarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="50" cy="50" r="43" />
    <polygon 
      points="50,26 55,41 71,41 58,50 63,66 50,56 37,66 42,50 29,41 45,41" 
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export default function App() {
  // --- Persistent Card Lists State ---
  const [cardLists, setCardLists] = useState<Record<SubCategory, Card[]>>(() => {
    try {
      const saved = localStorage.getItem('tcg_custom_card_lists');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...ALL_DATA };
        Object.keys(parsed).forEach((k) => {
          merged[k as SubCategory] = parsed[k];
        });
        return merged as Record<SubCategory, Card[]>;
      }
    } catch {
      // ignore
    }
    return ALL_DATA as Record<SubCategory, Card[]>;
  });

  useEffect(() => {
    localStorage.setItem('tcg_custom_card_lists', JSON.stringify(cardLists));
  }, [cardLists]);

  // --- Persistent Possession State ---
  const [possession, setPossession] = useState<PossessionState>(() => {
    try {
      const saved = localStorage.getItem('tcg_collection_possession');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('tcg_collection_possession', JSON.stringify(possession));
  }, [possession]);

  // --- Theme Mode State ---
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tcg_theme_mode');
      return saved ? saved === 'light' : false; // Defaults to dark theme
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('tcg_theme_mode', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const [bgPokemon, setBgPokemon] = useState<string>(() => {
    return localStorage.getItem('tcg_bg_pokemon') || '';
  });
  const [bgDragonBall, setBgDragonBall] = useState<string>(() => {
    return localStorage.getItem('tcg_bg_dragonball') || '';
  });
  const [showBgEditPokemon, setShowBgEditPokemon] = useState(false);
  const [showBgEditDragonBall, setShowBgEditDragonBall] = useState(false);

  useEffect(() => {
    localStorage.setItem('tcg_bg_pokemon', bgPokemon);
  }, [bgPokemon]);

  useEffect(() => {
    localStorage.setItem('tcg_bg_dragonball', bgDragonBall);
  }, [bgDragonBall]);

  // --- Navigation State ---
  const [currentCategory, setCurrentCategory] = useState<Category>('home');
  const [currentSubCategory, setCurrentSubCategory] = useState<SubCategory>('home');

  // --- Search & Filters State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'owned'>('all');
  const [sortMode, setSortMode] = useState<'date' | 'number'>('number');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- Edit/Management Mode States ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    nom: '',
    numero: '',
    set: '',
    langue: 'FR',
    image: '',
    rarete: 'Rare',
    variantesStr: 'normale, reverse'
  });
  const [addFormError, setAddFormError] = useState('');

  const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nom: '',
    numero: '',
    set: '',
    langue: '',
    image: '',
    rarete: '',
    variantesStr: ''
  });
  const [editFormError, setEditFormError] = useState('');

  // --- TCGdex API Integration States ---
  const [tcgDexSets, setTcgDexSets] = useState<{ id: string; name: string; logo?: string; cardCount: { total: number } }[]>([]);
  const [tcgDexSelectedSet, setTcgDexSelectedSet] = useState<string>('');
  const [tcgDexSearchQuery, setTcgDexSearchQuery] = useState<string>('');
  const [tcgDexAllCards, setTcgDexAllCards] = useState<{ id: string; localId: string; name: string; image?: string }[]>([]);
  const [tcgDexFilteredCards, setTcgDexFilteredCards] = useState<{ id: string; localId: string; name: string; image?: string; setName?: string }[]>([]);
  const [tcgDexLoading, setTcgDexLoading] = useState<boolean>(false);
  const [tcgDexError, setTcgDexError] = useState<string>('');
  const [tcgDexActiveTab, setTcgDexActiveTab] = useState<'search' | 'sets'>('search');
  const [tcgDexSetCards, setTcgDexSetCards] = useState<{ id: string; localId: string; name: string; image?: string; rarity?: string }[]>([]);
  const [tcgDexSetLoading, setTcgDexSetLoading] = useState<boolean>(false);
  const [importingCardId, setImportingCardId] = useState<string | null>(null);
  const [importingSet, setImportingSet] = useState<boolean>(false);
  const [tcgDexAddMethod, setTcgDexAddMethod] = useState<'tcgdex' | 'manual'>('tcgdex');

  // Load TCGdex sets when current category is pokemon
  useEffect(() => {
    if (currentCategory === 'pokemon') {
      fetch('https://api.tcgdex.net/v2/fr/sets')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTcgDexSets(data);
          }
        })
        .catch(err => {
          console.error('Error fetching TCGdex sets:', err);
        });
    }
  }, [currentCategory]);

  // Load entire TCGdex database once on mount to map local and default card images automatically
  useEffect(() => {
    fetch('https://api.tcgdex.net/v2/fr/cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const lookup: Record<string, string> = {};
          data.forEach(card => {
            if (card.name && card.localId && card.image) {
              const nameKey = card.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
              let numKey = card.localId.trim();
              if (/^\d+$/.test(numKey)) {
                numKey = parseInt(numKey, 10).toString();
              }
              numKey = numKey.toLowerCase();
              lookup[`${nameKey}::${numKey}`] = `${card.image}/low.png`;
            }
          });
          (window as any).tcgImageLookup = lookup;
          setTcgDexAllCards(data); // triggers a safe re-render to apply loaded images
        }
      })
      .catch(err => console.error("Error building TCG image lookup:", err));
  }, []);

  const loadAllTcgDexCards = async () => {
    if (tcgDexAllCards.length > 0) return tcgDexAllCards;
    setTcgDexLoading(true);
    setTcgDexError('');
    try {
      const res = await fetch('https://api.tcgdex.net/v2/fr/cards');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTcgDexAllCards(data);
        setTcgDexLoading(false);
        return data;
      }
      throw new Error('Format de données invalide');
    } catch (err) {
      setTcgDexLoading(false);
      setTcgDexError('Impossible de charger la base de données des cartes Pokémon.');
      return [];
    }
  };

  const handleTcgDexSearch = async (query: string) => {
    setTcgDexSearchQuery(query);
    if (query.trim().length < 3) {
      setTcgDexFilteredCards([]);
      return;
    }
    const cards = await loadAllTcgDexCards();
    const filtered = cards.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      c.id.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 50);
    setTcgDexFilteredCards(filtered);
  };

  const handleImportCard = async (tcgCardId: string) => {
    setImportingCardId(tcgCardId);
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/fr/cards/${tcgCardId}`);
      const data = await res.json();
      
      if (data && data.name) {
        const variants: string[] = [];
        if (data.variants) {
          if (data.variants.normal) variants.push('normale');
          if (data.variants.reverse) variants.push('reverse');
          if (data.variants.holo) variants.push('holo');
          if (data.variants.firstEdition) variants.push('1ère édition');
        }
        if (variants.length === 0) {
          variants.push('normale');
          if (data.rarity === 'Rare' || data.rarity === 'Holo') {
            variants.push('reverse');
          }
        }

        const newCard: Card = {
          nom: data.name,
          numero: data.localId,
          set: data.set ? data.set.name : (SECTION_LABELS[currentSubCategory] || 'Série'),
          langue: 'FR',
          image: data.image ? `${data.image}/low.png` : '',
          rarete: data.rarity || 'Common',
          variantes: variants,
          possede: {},
          createdAt: Date.now()
        };

        handleAddCard(newCard);
      }
    } catch (err) {
      console.error('Error importing card:', err);
      const cardBrief = tcgDexAllCards.find(c => c.id === tcgCardId);
      if (cardBrief) {
        const newCard: Card = {
          nom: cardBrief.name,
          numero: cardBrief.localId,
          set: SECTION_LABELS[currentSubCategory] || 'Série',
          langue: 'FR',
          image: cardBrief.image ? `${cardBrief.image}/low.png` : '',
          rarete: 'Rare',
          variantes: ['normale', 'reverse'],
          possede: {},
          createdAt: Date.now()
        };
        handleAddCard(newCard);
      }
    } finally {
      setImportingCardId(null);
    }
  };

  const handleSelectSet = async (setId: string) => {
    setTcgDexSelectedSet(setId);
    if (!setId) {
      setTcgDexSetCards([]);
      return;
    }
    setTcgDexSetLoading(true);
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/fr/sets/${setId}`);
      const data = await res.json();
      if (data && Array.isArray(data.cards)) {
        setTcgDexSetCards(data.cards);
      }
    } catch (err) {
      console.error('Error fetching set cards:', err);
    } finally {
      setTcgDexSetLoading(false);
    }
  };

  const handleImportWholeSet = async () => {
    if (!tcgDexSelectedSet || tcgDexSetCards.length === 0) return;
    setImportingSet(true);
    
    let setName = SECTION_LABELS[currentSubCategory] || 'Série';
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/fr/sets/${tcgDexSelectedSet}`);
      const data = await res.json();
      if (data && data.name) {
        setName = data.name;
      }
    } catch {
      // fallback
    }

    const newCards: Card[] = tcgDexSetCards.map((c, idx) => {
      const variants = ['normale'];
      if (c.rarity === 'Rare' || c.rarity === 'Holo') {
        variants.push('reverse');
      }
      return {
        nom: c.name,
        numero: c.localId,
        set: setName,
        langue: 'FR',
        image: c.image ? `${c.image}/low.png` : '',
        rarete: c.rarity || 'Common',
        variantes: variants,
        possede: {},
        createdAt: Date.now() - idx * 10
      };
    });

    setCardLists(prev => {
      const currentList = prev[currentSubCategory] || [];
      const existingKeys = new Set(currentList.map(item => `${item.set}::${item.numero}`));
      const filteredNewCards = newCards.filter(item => !existingKeys.has(`${item.set}::${item.numero}`));
      
      return {
        ...prev,
        [currentSubCategory]: [...filteredNewCards, ...currentList]
      };
    });

    setImportingSet(false);
    setTcgDexSelectedSet('');
    setTcgDexSetCards([]);
  };

  // Prefill defaults on section change
  useEffect(() => {
    if (currentSubCategory !== 'home') {
      const activeCards = cardLists[currentSubCategory] || [];
      const firstCard = activeCards[0];
      setAddForm({
        nom: '',
        numero: '',
        set: firstCard ? firstCard.set : (SECTION_LABELS[currentSubCategory] || ''),
        langue: firstCard ? firstCard.langue : (currentCategory === 'pokemon' ? 'FR' : 'JP'),
        image: '',
        rarete: firstCard ? firstCard.rarete : 'Rare',
        variantesStr: firstCard ? firstCard.variantes.join(', ') : 'normale, reverse'
      });
      setAddFormError('');
      setIsEditMode(false);
      setShowAddForm(false);
      setEditingCardKey(null);
      
      // Reset TCGdex search state when changing section
      setTcgDexSearchQuery('');
      setTcgDexFilteredCards([]);
      setTcgDexSelectedSet('');
      setTcgDexSetCards([]);
      setTcgDexAddMethod('tcgdex');
    }
  }, [currentSubCategory, currentCategory, cardLists]);

  // --- Reset Search/Filters when navigating ---
  const navigateToCategory = (cat: Category, subCat: SubCategory) => {
    setCurrentCategory(cat);
    setCurrentSubCategory(subCat);
    setSearchQuery('');
    setFilterMode('all');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // --- Handle Variant Toggle ---
  const handleToggleVariant = (card: Card, variant: string) => {
    const key = `${card.set}::${card.numero}::${variant}`;
    setPossession(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // --- Global Stats calculation ---
  const getStats = () => {
    let totalCards = 0;
    let totalVariants = 0;
    let ownedVariants = 0;

    (Object.values(cardLists) as Card[][]).forEach((cards) => {
      cards.forEach(card => {
        totalCards++;
        card.variantes.forEach(variant => {
          totalVariants++;
          const key = `${card.set}::${card.numero}::${variant}`;
          if (possession[key]) {
            ownedVariants++;
          }
        });
      });
    });

    return {
      totalCards,
      totalVariants,
      ownedVariants,
      percentage: totalVariants > 0 ? Math.round((ownedVariants / totalVariants) * 100) : 0
    };
  };

  const globalStats = getStats();

  // --- Section-specific Stats ---
  const getSectionStats = (subCatKey: string) => {
    const cards = cardLists[subCatKey as SubCategory] || [];
    let totalVariants = 0;
    let ownedVariants = 0;

    cards.forEach(card => {
      card.variantes.forEach(variant => {
        totalVariants++;
        const key = `${card.set}::${card.numero}::${variant}`;
        if (possession[key]) {
          ownedVariants++;
        }
      });
    });

    return {
      total: totalVariants,
      owned: ownedVariants,
      percentage: totalVariants > 0 ? Math.round((ownedVariants / totalVariants) * 100) : 0
    };
  };

  // --- Filtered Cards based on searchQuery, filterMode, and sortMode ---
  const getFilteredCards = () => {
    if (currentSubCategory === 'home') return [];
    const activeCards = cardLists[currentSubCategory] || [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = activeCards.filter(card => {
      // 1. Search filter
      const matchesSearch = 
        normalizedQuery === '' ||
        card.nom.toLowerCase().includes(normalizedQuery) ||
        card.numero.toLowerCase().includes(normalizedQuery);

      if (!matchesSearch) return false;

      // 2. Possession filters
      const cardVariantsKeys = card.variantes.map(v => `${card.set}::${card.numero}::${v}`);
      const ownedCount = cardVariantsKeys.filter(k => !!possession[k]).length;

      if (filterMode === 'all') return true;
      if (filterMode === 'missing') {
        return ownedCount < card.variantes.length;
      }
      if (filterMode === 'owned') {
        return ownedCount > 0;
      }

      return true;
    });

    // 3. Sorting
    if (sortMode === 'number') {
      return [...filtered].sort((a, b) => {
        const numA = extractCardNumberForSorting(a.numero);
        const numB = extractCardNumberForSorting(b.numero);
        if (numA !== numB) {
          return numA - numB;
        }
        return a.nom.localeCompare(b.nom);
      });
    } else {
      // Sort by addition date (createdAt)
      return [...filtered].sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        if (timeA !== timeB) {
          return timeB - timeA; // Descending (newest first)
        }
        // Fallback to natural order index to maintain stable sorting
        const idxA = activeCards.indexOf(a);
        const idxB = activeCards.indexOf(b);
        return idxA - idxB;
      });
    }
  };

  const activeCardsList = getFilteredCards();
  const activeSubCategoryStats = currentSubCategory !== 'home' ? getSectionStats(currentSubCategory) : null;

  // --- Card List Management Operations ---
  const handleMoveCardByKey = (set: string, numero: string, direction: 'up' | 'down') => {
    const list = cardLists[currentSubCategory];
    if (!list) return;
    
    const index = list.findIndex(c => c.set === set && c.numero === numero);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    const newList = [...list];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    
    setCardLists(prev => ({
      ...prev,
      [currentSubCategory]: newList
    }));
  };

  const handleUpdateCardByKey = (originalSet: string, originalNumero: string, updatedCard: Card) => {
    const list = cardLists[currentSubCategory];
    if (!list) return;
    
    const index = list.findIndex(c => c.set === originalSet && c.numero === originalNumero);
    if (index === -1) return;
    
    const newList = [...list];
    newList[index] = updatedCard;
    
    // Migrate possession keys if details changed
    if (originalSet !== updatedCard.set || originalNumero !== updatedCard.numero) {
      setPossession(prev => {
        const next = { ...prev };
        updatedCard.variantes.forEach(v => {
          const oldKey = `${originalSet}::${originalNumero}::${v}`;
          const newKey = `${updatedCard.set}::${updatedCard.numero}::${v}`;
          if (next[oldKey] !== undefined) {
            next[newKey] = next[oldKey];
            delete next[oldKey];
          }
        });
        return next;
      });
    }
    
    setCardLists(prev => ({
      ...prev,
      [currentSubCategory]: newList
    }));
  };

  const handleDeleteCardByKey = (set: string, numero: string) => {
    const list = cardLists[currentSubCategory];
    if (!list) return;
    
    const newList = list.filter(c => !(c.set === set && c.numero === numero));
    
    // Clean up possession keys
    setPossession(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${set}::${numero}::`)) {
          delete next[k];
        }
      });
      return next;
    });

    setCardLists(prev => ({
      ...prev,
      [currentSubCategory]: newList
    }));
  };

  const handleAddCard = (newCard: Card) => {
    const list = cardLists[currentSubCategory] || [];
    const newList = [newCard, ...list];
    
    setCardLists(prev => ({
      ...prev,
      [currentSubCategory]: newList
    }));
  };

  // Helper for reading loaded images from user's filesystem as base64 to persist forever in localStorage
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1.5 * 1024 * 1024) {
      const errorMsg = "L'image est trop grande (max 1.5 Mo pour la mémoire locale)";
      if (formType === 'add') setAddFormError(errorMsg);
      else setEditFormError(errorMsg);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (formType === 'add') {
        setAddForm(prev => ({ ...prev, image: base64 }));
        setAddFormError('');
      } else {
        setEditForm(prev => ({ ...prev, image: base64 }));
        setEditFormError('');
      }
    };
    reader.onerror = () => {
      const errorMsg = "Erreur lors de la lecture du fichier photo";
      if (formType === 'add') setAddFormError(errorMsg);
      else setEditFormError(errorMsg);
    };
    reader.readAsDataURL(file);
  };

  // --- Add Card Form Submit ---
  const handleAddFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!addForm.nom.trim() || !addForm.numero.trim()) {
      setAddFormError('Le nom et le numéro sont requis.');
      return;
    }
    
    const newCard: Card = {
      nom: addForm.nom.trim(),
      numero: addForm.numero.trim(),
      set: addForm.set.trim() || (SECTION_LABELS[currentSubCategory] || 'Série'),
      langue: addForm.langue.trim() || 'FR',
      image: addForm.image.trim(),
      rarete: addForm.rarete.trim() || 'Common',
      variantes: addForm.variantesStr.split(',').map(v => v.trim()).filter(Boolean),
      possede: {},
      createdAt: Date.now()
    };
    
    handleAddCard(newCard);
    setShowAddForm(false);
    setAddForm(prev => ({
      ...prev,
      nom: '',
      numero: '',
      image: ''
    }));
    setAddFormError('');
  };

  // --- Start Editing Card ---
  const startEditing = (card: Card) => {
    setEditingCardKey(`${card.set}::${card.numero}`);
    setEditForm({
      nom: card.nom,
      numero: card.numero,
      set: card.set,
      langue: card.langue,
      image: card.image || '',
      rarete: card.rarete,
      variantesStr: card.variantes.join(', ')
    });
    setEditFormError('');
  };

  // --- Edit Card Form Submit ---
  const handleEditFormSubmit = (e: FormEvent, originalSet: string, originalNumero: string) => {
    e.preventDefault();
    if (!editForm.nom.trim() || !editForm.numero.trim()) {
      setEditFormError('Le nom et le numéro sont requis.');
      return;
    }
    
    const list = cardLists[currentSubCategory];
    const originalCard = list?.find(c => c.set === originalSet && c.numero === originalNumero);

    const updatedCard: Card = {
      nom: editForm.nom.trim(),
      numero: editForm.numero.trim(),
      set: editForm.set.trim(),
      langue: editForm.langue.trim(),
      image: editForm.image.trim(),
      rarete: editForm.rarete.trim(),
      variantes: editForm.variantesStr.split(',').map(v => v.trim()).filter(Boolean),
      possede: {},
      createdAt: originalCard?.createdAt || Date.now()
    };
    
    handleUpdateCardByKey(originalSet, originalNumero, updatedCard);
    setEditingCardKey(null);
  };

  // --- Reset All Possession Progress & Custom Lists ---
  const handleResetCollection = () => {
    setPossession({});
    setCardLists(ALL_DATA as Record<SubCategory, Card[]>);
    localStorage.removeItem('tcg_custom_card_lists');
    setIsEditMode(false);
    setShowAddForm(false);
    setEditingCardKey(null);
    setShowResetConfirm(false);
  };

  return (
    <div id="app-root" className={`min-h-screen flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300 ${
      isLightMode ? 'bg-[#f1f1f4]' : 'bg-[#060608]'
    }`}>
      {/* Mobile Frame Container */}
      <div className={`w-full max-w-md min-h-screen flex flex-col shadow-2xl relative border-x transition-colors duration-300 ${
        isLightMode ? 'bg-white border-zinc-200' : 'bg-[#0c0c0e] border-zinc-900'
      }`}>
        
        {/* TOP GLOBAL BAR */}
        <header className={`sticky top-0 z-50 backdrop-blur-md px-4 py-3.5 flex flex-col gap-2 border-b transition-colors duration-300 ${
          isLightMode ? 'bg-white/95 border-zinc-200' : 'bg-[#0c0c0e]/95 border-zinc-900/80'
        }`}>
          <div className="flex items-center justify-between">
            {currentCategory === 'home' ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-600/10 text-white">
                  <PokeballIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className={`font-display font-bold text-base tracking-tight transition-colors duration-300 ${
                    isLightMode ? 'text-zinc-900' : 'text-white'
                  }`}>Brutalikwak</h1>
                  <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Suivi de collection TCG</p>
                </div>
              </div>
            ) : (
              <button 
                id="btn-back-home"
                onClick={() => {
                  if (currentSubCategory !== 'home') {
                    navigateToCategory(currentCategory, 'home');
                  } else {
                    navigateToCategory('home', 'home');
                  }
                }}
                className={`flex items-center gap-1.5 transition-colors py-1 px-2 -ml-2 rounded-lg active:scale-95 font-medium text-xs ${
                  isLightMode ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Retour</span>
              </button>
            )}

            {/* Right-aligned Header Actions */}
            <div className="flex items-center gap-1">
              {/* Sun/Moon Theme Toggle Button */}
              <button
                id="btn-theme-toggle"
                onClick={() => setIsLightMode(!isLightMode)}
                className={`p-2 rounded-lg transition-colors active:scale-95 ${
                  isLightMode ? 'text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100' : 'text-zinc-400 hover:text-indigo-400 hover:bg-white/5'
                }`}
                title={isLightMode ? "Mode Sombre" : "Mode Clair"}
              >
                {isLightMode ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                )}
              </button>

              {currentCategory !== 'home' && (
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                  isLightMode ? 'text-zinc-600 bg-zinc-100 border border-zinc-200' : 'text-zinc-500 bg-zinc-900/60 border border-zinc-800'
                }`}>
                  {currentCategory === 'pokemon' ? 'Pokémon' : 'Dragon Ball'}
                </span>
              )}
            </div>
          </div>

          {/* Global Progress Sticky Banner */}
          {currentCategory === 'home' && (
            <div className={`border rounded-xl p-3 flex flex-col gap-1.5 transition-colors duration-300 ${
              isLightMode ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  isLightMode ? 'text-zinc-700' : 'text-zinc-400'
                }`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`} />
                  <span>Progression globale</span>
                </div>
                <span className={`font-mono text-xs font-bold ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  {globalStats.ownedVariants} / {globalStats.totalVariants} <span className={`text-[10px] font-semibold ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'}`}>({globalStats.percentage}%)</span>
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${globalStats.percentage}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* --- MAIN PAGE VIEWS --- */}
        <main className="flex-1 flex flex-col p-4 pb-20">
          
          {/* ==================================== */}
          {/* 1. CATEGORY HOME VIEW                */}
          {/* ==================================== */}
          {currentCategory === 'home' && (
            <div id="view-home" className="flex flex-col gap-5">

              {/* TWO LARGE TOUCHSCREEN CATEGORY BUTTONS */}
              <div className="grid grid-cols-1 gap-4 mt-1">
                {/* Pokémon Button */}
                <div
                  id="btn-cat-pokemon"
                  onClick={() => navigateToCategory('pokemon', 'home')}
                  className={`relative group overflow-hidden flex flex-col items-start p-5 rounded-2xl border active:scale-[0.99] transition-all duration-300 text-left cursor-pointer ${
                    isLightMode 
                      ? 'border-zinc-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(99,102,241,0.08)]' 
                      : 'border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:border-indigo-500/30'
                  }`}
                >
                  {/* Blurry Background Image behind the text */}
                  {bgPokemon && (
                    <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden rounded-2xl animate-fade-in">
                      <img 
                        src={bgPokemon} 
                        className="w-full h-full object-cover filter blur-[4px] scale-[1.05] opacity-25" 
                        alt="" 
                      />
                      <div className={`absolute inset-0 ${isLightMode ? 'bg-white/70' : 'bg-[#0c0c0e]/75'}`} />
                    </div>
                  )}

                  {/* Gear button to change background */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBgEditPokemon(!showBgEditPokemon);
                    }}
                    className={`absolute top-3 right-3 z-30 p-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                      isLightMode ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500' : 'bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400'
                    }`}
                    title="Changer l'image de fond"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative z-10 w-full flex flex-col items-start">
                    <div className="absolute -top-1 -right-1 opacity-15 group-hover:scale-110 transition-transform">
                      <PokeballIcon className="w-20 h-20 text-indigo-400" />
                    </div>
                    
                    <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
                      <PokeballIcon className="w-5 h-5" />
                    </div>
                    
                    <span className={`font-display font-bold text-lg tracking-tight transition-colors duration-300 ${
                      isLightMode ? 'text-zinc-900' : 'text-white'
                    }`}>Pokémon</span>
                    
                    <p className={`text-xs mt-1 transition-colors duration-300 max-w-[85%] ${
                      isLightMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>Master Set (Brutalibré, Tarinorme, Psykokwak) & Full Sets</p>
                    
                    {/* Category Progress */}
                    <div className="w-full mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Collection Pokémon</span>
                      <span className={`font-mono font-bold transition-colors duration-300 ${
                        isLightMode ? 'text-zinc-700' : 'text-zinc-300'
                      }`}>
                        {(Object.entries(cardLists) as [SubCategory, Card[]][])
                          .filter(([k]) => k.startsWith('masterset') || k.startsWith('fullset'))
                          .reduce((acc, [, cards]) => acc + cards.reduce((cAcc, c) => cAcc + c.variantes.filter(v => possession[`${c.set}::${c.numero}::${v}`]).length, 0), 0)} / 
                        {(Object.entries(cardLists) as [SubCategory, Card[]][])
                          .filter(([k]) => k.startsWith('masterset') || k.startsWith('fullset'))
                          .reduce((acc, [, cards]) => acc + cards.reduce((cAcc, c) => cAcc + c.variantes.length, 0), 0)} variantes
                      </span>
                    </div>
                  </div>

                  {/* Inline Background image editing panel */}
                  {showBgEditPokemon && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className={`absolute inset-x-0 bottom-0 z-20 p-3.5 flex flex-col gap-2 border-t text-xs transition-all duration-300 ${
                        isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0a0a0c] border-zinc-900 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase text-[9px] text-zinc-500 tracking-wider">Image de fond Pokémon</span>
                        <button 
                          onClick={() => setShowBgEditPokemon(false)} 
                          className="text-zinc-500 hover:text-red-400 font-bold active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          value={bgPokemon} 
                          onChange={(e) => setBgPokemon(e.target.value)} 
                          placeholder="Coller l'URL de l'image de fond..." 
                          className={`flex-1 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                          }`}
                        />
                        <label className="flex items-center justify-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold rounded cursor-pointer select-none">
                          Fichier
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onload = (ev) => setBgPokemon(ev.target?.result as string);
                                r.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                        {bgPokemon && (
                          <button 
                            onClick={() => setBgPokemon('')} 
                            className="px-2.5 py-1.5 bg-red-900/40 hover:bg-red-850 text-red-400 hover:text-red-300 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                        <button 
                          onClick={() => setShowBgEditPokemon(false)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded cursor-pointer active:scale-95 transition-all"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dragon Ball Button */}
                <div
                  id="btn-cat-dragonball"
                  onClick={() => navigateToCategory('dragonball', 'home')}
                  className={`relative group overflow-hidden flex flex-col items-start p-5 rounded-2xl border active:scale-[0.99] transition-all duration-300 text-left cursor-pointer ${
                    isLightMode 
                      ? 'border-zinc-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-amber-500/30 hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)]' 
                      : 'border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:border-amber-500/30'
                  }`}
                >
                  {/* Blurry Background Image behind the text */}
                  {bgDragonBall && (
                    <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden rounded-2xl animate-fade-in">
                      <img 
                        src={bgDragonBall} 
                        className="w-full h-full object-cover filter blur-[4px] scale-[1.05] opacity-25" 
                        alt="" 
                      />
                      <div className={`absolute inset-0 ${isLightMode ? 'bg-white/70' : 'bg-[#0c0c0e]/75'}`} />
                    </div>
                  )}

                  {/* Gear button to change background */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBgEditDragonBall(!showBgEditDragonBall);
                    }}
                    className={`absolute top-3 right-3 z-30 p-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                      isLightMode ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500' : 'bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400'
                    }`}
                    title="Changer l'image de fond"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative z-10 w-full flex flex-col items-start">
                    <div className="absolute -top-1 -right-1 opacity-15 group-hover:scale-110 transition-transform">
                      <DragonBallOneStarIcon className="w-20 h-20 text-amber-500" />
                    </div>
                    
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                      <DragonBallOneStarIcon className="w-5 h-5" />
                    </div>
                    
                    <span className={`font-display font-bold text-lg tracking-tight transition-colors duration-300 ${
                      isLightMode ? 'text-zinc-900' : 'text-white'
                    }`}>Dragon Ball</span>
                    
                    <p className={`text-xs mt-1 transition-colors duration-300 max-w-[85%] ${
                      isLightMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>DBS Fusion World (FB04 & FB09)</p>
                    
                    {/* Category Progress */}
                    <div className="w-full mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Collection Dragon Ball</span>
                      <span className={`font-mono font-bold transition-colors duration-300 ${
                        isLightMode ? 'text-zinc-700' : 'text-zinc-300'
                      }`}>
                        {(Object.entries(cardLists) as [SubCategory, Card[]][])
                          .filter(([k]) => k.startsWith('db_'))
                          .reduce((acc, [, cards]) => acc + cards.reduce((cAcc, c) => cAcc + c.variantes.filter(v => possession[`${c.set}::${c.numero}::${v}`]).length, 0), 0)} / 
                        {(Object.entries(cardLists) as [SubCategory, Card[]][])
                          .filter(([k]) => k.startsWith('db_'))
                          .reduce((acc, [, cards]) => acc + cards.reduce((cAcc, c) => cAcc + c.variantes.length, 0), 0)} variantes
                      </span>
                    </div>
                  </div>

                  {/* Inline Background image editing panel */}
                  {showBgEditDragonBall && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className={`absolute inset-x-0 bottom-0 z-20 p-3.5 flex flex-col gap-2 border-t text-xs transition-all duration-300 ${
                        isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0a0a0c] border-zinc-900 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase text-[9px] text-zinc-500 tracking-wider">Image de fond Dragon Ball</span>
                        <button 
                          onClick={() => setShowBgEditDragonBall(false)} 
                          className="text-zinc-500 hover:text-red-400 font-bold active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          value={bgDragonBall} 
                          onChange={(e) => setBgDragonBall(e.target.value)} 
                          placeholder="Coller l'URL de l'image de fond..." 
                          className={`flex-1 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isLightMode ? 'bg-zinc-50 border border-zinc-200 text-zinc-900' : 'bg-zinc-900 border border-zinc-800 text-white'
                          }`}
                        />
                        <label className="flex items-center justify-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold rounded cursor-pointer select-none">
                          Fichier
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onload = (ev) => setBgDragonBall(ev.target?.result as string);
                                r.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                        {bgDragonBall && (
                          <button 
                            onClick={() => setBgDragonBall('')} 
                            className="px-2.5 py-1.5 bg-red-900/40 hover:bg-red-850 text-red-400 hover:text-red-300 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                        <button 
                          onClick={() => setShowBgEditDragonBall(false)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded cursor-pointer active:scale-95 transition-all"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fast Statistics Table */}
              <div className={`border rounded-2xl p-4.5 transition-colors duration-300 ${
                isLightMode ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-900 bg-zinc-950/20'
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-3">RÉPARTITION PAR CATÉGORIE</span>
                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'masterset_brutalibre', label: 'Brutalibré' },
                    { id: 'masterset_tarinorme', label: 'Tarinorme' },
                    { id: 'masterset_psykokwak', label: 'Psykokwak' },
                    { id: 'fullset_heros_transcendants', label: 'Héros Transcendants' },
                    { id: 'fullset_chaos_ascendant', label: 'Chaos Ascendant' },
                    { id: 'db_fb04', label: 'DBS FB04' },
                    { id: 'db_fb09', label: 'DBS FB09' },
                  ].map((item) => {
                    const stats = getSectionStats(item.id);
                    return (
                      <div key={item.id} className={`flex items-center justify-between py-1 border-b last:border-0 ${
                        isLightMode ? 'border-zinc-100' : 'border-zinc-900'
                      }`}>
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          isLightMode ? 'text-zinc-700' : 'text-zinc-400'
                        }`}>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-zinc-500">
                            {stats.owned}/{stats.total}
                          </span>
                          <span className={`text-xs font-bold font-mono w-9 text-right ${
                            isLightMode ? 'text-indigo-600' : 'text-zinc-300'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* 2. POKÉMON SELECTIONS PANEL         */}
          {/* ==================================== */}
          {currentCategory === 'pokemon' && currentSubCategory === 'home' && (
            <div id="view-pokemon-selection" className="flex flex-col gap-6">
              
              {/* Category Header */}
              <div className="flex flex-col gap-1">
                <h2 className={`font-display font-bold text-lg ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>Collection Pokémon</h2>
                <p className={`text-xs ${isLightMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Sélectionnez la section ou l'extension à consulter.</p>
              </div>

              {/* SECTION A: MASTER SET */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>MASTER SETS (Toutes Séries)</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'masterset_brutalibre', name: 'Brutalibré', subtitle: 'Toutes les cartes françaises existantes' },
                    { id: 'masterset_tarinorme', name: 'Tarinorme', subtitle: 'Toutes les cartes françaises existantes' },
                    { id: 'masterset_psykokwak', name: 'Psykokwak', subtitle: 'Toutes les cartes françaises existantes' }
                  ].map((pk) => {
                    const stats = getSectionStats(pk.id);
                    return (
                      <button
                        key={pk.id}
                        id={`btn-sub-${pk.id}`}
                        onClick={() => navigateToCategory('pokemon', pk.id as SubCategory)}
                        className={`flex items-center justify-between p-4 rounded-xl border active:scale-[0.98] text-left cursor-pointer transition-colors duration-200 ${
                          isLightMode 
                            ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300' 
                            : 'bg-zinc-900/35 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <span className={`font-bold text-sm block ${isLightMode ? 'text-zinc-800' : 'text-zinc-200'}`}>{pk.name}</span>
                          <span className={`text-[11px] block mt-0.5 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{pk.subtitle}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {stats.owned} / {stats.total}
                          </span>
                          <div className={`w-12 h-1 rounded-full overflow-hidden ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                            <div className="bg-indigo-500 h-full" style={{ width: `${stats.percentage}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION B: FULL SETS */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <FolderHeart className="w-3.5 h-3.5 text-indigo-400" />
                  <span>COMPLÉTER DES EXTENSIONS</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'fullset_heros_transcendants', name: 'Héros Transcendants', subtitle: 'Set complet' },
                    { id: 'fullset_chaos_ascendant', name: 'Chaos Ascendant', subtitle: 'Set complet' }
                  ].map((set) => {
                    const stats = getSectionStats(set.id);
                    return (
                      <button
                        key={set.id}
                        id={`btn-sub-${set.id}`}
                        onClick={() => navigateToCategory('pokemon', set.id as SubCategory)}
                        className={`flex items-center justify-between p-4 rounded-xl border active:scale-[0.98] text-left cursor-pointer transition-colors duration-200 ${
                          isLightMode 
                            ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300' 
                            : 'bg-zinc-900/35 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <span className={`font-bold text-sm block ${isLightMode ? 'text-zinc-800' : 'text-zinc-200'}`}>{set.name}</span>
                          <span className={`text-[11px] block mt-0.5 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{set.subtitle}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {stats.owned} / {stats.total}
                          </span>
                          <div className={`w-12 h-1 rounded-full overflow-hidden ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                            <div className="bg-indigo-500 h-full" style={{ width: `${stats.percentage}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* 3. DRAGON BALL SELECTIONS PANEL     */}
          {/* ==================================== */}
          {currentCategory === 'dragonball' && currentSubCategory === 'home' && (
            <div id="view-dragonball-selection" className="flex flex-col gap-5">
              
              {/* Category Header */}
              <div className="flex flex-col gap-1">
                <h2 className={`font-display font-bold text-lg ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>Dragon Ball Super</h2>
                <p className={`text-xs ${isLightMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Consultez et complétez les extensions Fusion World.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'db_fb04', name: 'FB04 - Limitless Ultra', subtitle: 'Set complet Dragon Ball' },
                  { id: 'db_fb09', name: 'FB09 - Ultimate Fusion', subtitle: 'Set complet Dragon Ball' }
                ].map((db) => {
                  const stats = getSectionStats(db.id);
                  return (
                    <button
                      key={db.id}
                      id={`btn-sub-${db.id}`}
                      onClick={() => navigateToCategory('dragonball', db.id as SubCategory)}
                      className={`flex items-center justify-between p-4 rounded-xl border active:scale-[0.98] text-left cursor-pointer transition-colors duration-200 ${
                        isLightMode 
                          ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300' 
                          : 'bg-zinc-900/35 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 font-bold text-xs">
                          DB
                        </div>
                        <div>
                          <span className={`font-bold text-sm block ${isLightMode ? 'text-zinc-800' : 'text-zinc-200'}`}>{db.name}</span>
                          <span className={`text-[11px] block mt-0.5 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{db.subtitle}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-bold text-amber-500">
                          {stats.owned} / {stats.total}
                        </span>
                        <div className={`w-12 h-1 rounded-full overflow-hidden ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                          <div className="bg-amber-500 h-full" style={{ width: `${stats.percentage}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* 4. ACTIVE SECTIONS & CARD CHECKLIST  */}
          {/* ==================================== */}
          {currentSubCategory !== 'home' && (
            <div id="view-checklist" className="flex flex-col gap-4">
              
              {/* Back breadcrumb, section header and edit toggle */}
              <div className="flex items-end justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {currentCategory === 'pokemon' ? 'Pokémon' : 'Dragon Ball Super'}
                  </span>
                  <h2 className={`font-display font-bold text-lg ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
                    {SECTION_LABELS[currentSubCategory]}
                  </h2>
                </div>

                <button
                  id="btn-toggle-edit-mode"
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                    setShowAddForm(false);
                    setEditingCardKey(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isEditMode 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/20' 
                      : isLightMode
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Quitter' : 'Gérer'}</span>
                </button>
              </div>

              {/* Section Statistics Panel */}
              {activeSubCategoryStats && (
                <div className={`border rounded-xl p-3 flex flex-col gap-2 transition-colors duration-300 ${
                  isLightMode ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/40 border-zinc-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      isLightMode ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      Complétion de la liste
                    </span>
                    <span className={`font-mono text-xs font-bold ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      {activeSubCategoryStats.owned} / {activeSubCategoryStats.total} <span className={`text-[10px] font-semibold ${isLightMode ? 'text-zinc-500' : 'text-zinc-500'}`}>({activeSubCategoryStats.percentage}%)</span>
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${activeSubCategoryStats.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Gérer les cartes Section */}
              {isEditMode && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Gérer les cartes
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Ajoutez, modifiez l'ordre ou les informations.</p>
                    </div>
                    
                    <button
                      id="btn-show-add-card-form"
                      onClick={() => {
                        setShowAddForm(!showAddForm);
                        setEditingCardKey(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white flex items-center gap-1 hover:bg-indigo-500 transition-colors active:scale-95 cursor-pointer"
                    >
                      {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{showAddForm ? 'Annuler' : 'Ajouter une carte'}</span>
                    </button>
                  </div>

                  {/* ADD CARD FORM */}
                  {showAddForm && (
                    <div className="flex flex-col gap-3 border-t border-indigo-500/10 pt-3.5 mt-1">
                      <h4 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        Nouvelle Carte
                      </h4>
                      {addFormError && <p className="text-red-400 text-[11px] font-semibold">{addFormError}</p>}

                      {/* Tab Selector for Pokemon */}
                      {currentCategory === 'pokemon' && (
                        <div className="flex bg-zinc-950/40 p-1 rounded-lg border border-zinc-900/60 mb-1">
                          <button
                            type="button"
                            onClick={() => setTcgDexAddMethod('tcgdex')}
                            className={`flex-1 py-1 rounded-md text-[11px] font-bold text-center transition-all cursor-pointer ${
                              tcgDexAddMethod === 'tcgdex' 
                                ? 'bg-indigo-600/90 text-white shadow' 
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Base TCGdex
                          </button>
                          <button
                            type="button"
                            onClick={() => setTcgDexAddMethod('manual')}
                            className={`flex-1 py-1 rounded-md text-[11px] font-bold text-center transition-all cursor-pointer ${
                              tcgDexAddMethod === 'manual' 
                                ? 'bg-indigo-600/90 text-white shadow' 
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Saisie manuelle
                          </button>
                        </div>
                      )}

                      {/* METHOD 1: TCGDEX SEARCH/IMPORT */}
                      {currentCategory === 'pokemon' && tcgDexAddMethod === 'tcgdex' ? (
                        <div className="flex flex-col gap-3">
                          {/* Inner Tabs: Search vs Sets */}
                          <div className="flex gap-1.5 bg-zinc-900/30 p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setTcgDexActiveTab('search');
                                setTcgDexSelectedSet('');
                              }}
                              className={`flex-1 py-1 rounded-md text-[10px] font-semibold text-center cursor-pointer transition-colors ${
                                tcgDexActiveTab === 'search' && !tcgDexSelectedSet
                                  ? 'bg-zinc-800 text-zinc-200 font-bold' 
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Recherche par nom
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTcgDexActiveTab('sets');
                              }}
                              className={`flex-1 py-1 rounded-md text-[10px] font-semibold text-center cursor-pointer transition-colors ${
                                tcgDexActiveTab === 'sets' || tcgDexSelectedSet
                                  ? 'bg-zinc-800 text-zinc-200 font-bold' 
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Par série
                            </button>
                          </div>

                          {/* SEARCH BY NAME SUB-TAB */}
                          {tcgDexActiveTab === 'search' && !tcgDexSelectedSet && (
                            <div className="flex flex-col gap-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input
                                  type="text"
                                  value={tcgDexSearchQuery}
                                  onChange={(e) => handleTcgDexSearch(e.target.value)}
                                  placeholder="Entrez un nom (ex: Dracaufeu, Mew)..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              {tcgDexLoading && (
                                <p className="text-zinc-500 text-[10px] italic flex items-center gap-1.5 py-2">
                                  <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                  Chargement de la base de données...
                                </p>
                              )}

                              {tcgDexError && <p className="text-red-400 text-[10px]">{tcgDexError}</p>}

                              {/* Search Results List */}
                              {!tcgDexLoading && tcgDexFilteredCards.length > 0 && (
                                <div className="max-h-60 overflow-y-auto bg-zinc-950/60 border border-zinc-900 rounded-lg p-1 divide-y divide-zinc-900 flex flex-col">
                                  {tcgDexFilteredCards.map(c => {
                                    const isAdded = cardLists[currentSubCategory]?.some(card => card.numero === c.localId && card.nom.toLowerCase() === c.name.toLowerCase());
                                    return (
                                      <div key={c.id} className="flex items-center justify-between p-1.5 hover:bg-zinc-900/40 rounded transition-colors gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-11 bg-zinc-900/80 rounded overflow-hidden flex items-center justify-center border border-zinc-800 flex-shrink-0">
                                            {c.image ? (
                                              <img 
                                                src={`${c.image}/low.png`} 
                                                alt="" 
                                                className="w-full h-full object-contain"
                                                referrerPolicy="no-referrer"
                                                loading="lazy"
                                              />
                                            ) : (
                                              <span className="text-[8px] text-zinc-600 font-bold">TCG</span>
                                            )}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-xs text-white font-bold truncate">{c.name}</span>
                                            <span className="text-[10px] text-zinc-500 font-mono truncate">N° {c.localId}</span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          disabled={importingCardId === c.id || isAdded}
                                          onClick={() => handleImportCard(c.id)}
                                          className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                            isAdded 
                                              ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-400' 
                                              : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                                          }`}
                                        >
                                          {importingCardId === c.id ? (
                                            <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          ) : isAdded ? (
                                            <Check className="w-3 h-3" />
                                          ) : (
                                            <Download className="w-3 h-3" />
                                          )}
                                          <span>{isAdded ? 'Ajoutée' : 'Importer'}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {!tcgDexLoading && tcgDexSearchQuery.trim().length >= 3 && tcgDexFilteredCards.length === 0 && (
                                <p className="text-zinc-500 text-[10px] text-center py-2">Aucune carte trouvée pour "{tcgDexSearchQuery}"</p>
                              )}
                            </div>
                          )}

                          {/* BROWSE AND IMPORT BY SET SUB-TAB */}
                          {tcgDexActiveTab === 'sets' && (
                            <div className="flex flex-col gap-2.5">
                              <select
                                value={tcgDexSelectedSet}
                                onChange={(e) => handleSelectSet(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">-- Choisir une série Pokémon --</option>
                                {tcgDexSets.map(set => (
                                  <option key={set.id} value={set.id}>
                                    {set.name} ({set.cardCount.total} cartes)
                                  </option>
                                ))}
                              </select>

                              {tcgDexSetLoading && (
                                <p className="text-zinc-500 text-[10px] italic flex items-center gap-1.5 py-2 justify-center">
                                  <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                  Chargement des cartes de la série...
                                </p>
                              )}

                              {!tcgDexSetLoading && tcgDexSelectedSet && tcgDexSetCards.length > 0 && (
                                <div className="flex flex-col gap-2 border border-zinc-900 bg-zinc-950/20 p-2 rounded-xl">
                                  {/* Import All Set CTA */}
                                  <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/20 p-2 rounded-lg">
                                    <div className="flex flex-col">
                                      <span className="text-[11px] text-indigo-300 font-bold">Importer la série complète ?</span>
                                      <span className="text-[9px] text-zinc-400 mt-0.5">Cette action va importer les {tcgDexSetCards.length} cartes.</span>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={importingSet}
                                      onClick={handleImportWholeSet}
                                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                    >
                                      {importingSet ? (
                                        <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Download className="w-3.5 h-3.5" />
                                      )}
                                      <span>Importer tout</span>
                                    </button>
                                  </div>

                                  {/* List of Set Cards */}
                                  <div className="max-h-56 overflow-y-auto bg-zinc-950/60 p-1 rounded-lg border border-zinc-900 divide-y divide-zinc-900 flex flex-col mt-1">
                                    {tcgDexSetCards.map(c => {
                                      const isAdded = cardLists[currentSubCategory]?.some(card => card.numero === c.localId);
                                      return (
                                        <div key={c.id} className="flex items-center justify-between p-1.5 hover:bg-zinc-900/40 rounded transition-colors gap-2">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-11 bg-zinc-900/80 rounded overflow-hidden flex items-center justify-center border border-zinc-800 flex-shrink-0">
                                              {c.image ? (
                                                <img 
                                                  src={`${c.image}/low.png`} 
                                                  alt="" 
                                                  className="w-full h-full object-contain"
                                                  referrerPolicy="no-referrer"
                                                  loading="lazy"
                                                />
                                              ) : (
                                                <span className="text-[8px] text-zinc-600 font-bold">TCG</span>
                                              )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-xs text-white font-bold truncate">{c.name}</span>
                                              <span className="text-[10px] text-zinc-500 font-mono">N° {c.localId}</span>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            disabled={importingCardId === c.id || isAdded}
                                            onClick={() => handleImportCard(c.id)}
                                            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                              isAdded 
                                                ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-400' 
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                                            }`}
                                          >
                                            {importingCardId === c.id ? (
                                              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : isAdded ? (
                                              <Check className="w-3 h-3" />
                                            ) : (
                                              <Download className="w-3 h-3" />
                                            )}
                                            <span>{isAdded ? 'Ajoutée' : 'Importer'}</span>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* METHOD 2: MANUAL CARD FORM */
                        <form 
                          onSubmit={handleAddFormSubmit}
                          className="flex flex-col gap-3"
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="flex flex-col gap-1 col-span-2">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Nom de la carte</label>
                              <input 
                                type="text"
                                value={addForm.nom}
                                onChange={(e) => setAddForm(prev => ({ ...prev, nom: e.target.value }))}
                                placeholder="ex: Dracaufeu EX, Goku SS"
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Numéro de la carte</label>
                              <input 
                                type="text"
                                value={addForm.numero}
                                onChange={(e) => setAddForm(prev => ({ ...prev, numero: e.target.value }))}
                                placeholder="ex: 063/111, FB04-001"
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Rareté</label>
                              <input 
                                type="text"
                                value={addForm.rarete}
                                onChange={(e) => setAddForm(prev => ({ ...prev, rarete: e.target.value }))}
                                placeholder="ex: Rare, SCR, EX, L"
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Série (Set)</label>
                              <input 
                                type="text"
                                value={addForm.set}
                                onChange={(e) => setAddForm(prev => ({ ...prev, set: e.target.value }))}
                                placeholder="ex: XY - Poing Furieux"
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Langue</label>
                              <select 
                                value={addForm.langue}
                                onChange={(e) => setAddForm(prev => ({ ...prev, langue: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="FR">FR</option>
                                <option value="JP">JP</option>
                                <option value="EN">EN</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1 col-span-2">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Image de la carte (URL ou Fichier)</label>
                              <div className="flex flex-col gap-1.5">
                                <input 
                                  type="text"
                                  value={addForm.image}
                                  onChange={(e) => setAddForm(prev => ({ ...prev, image: e.target.value }))}
                                  placeholder="ex: https://site.com/image.png"
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-2">
                                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer select-none">
                                    <Download className="w-3.5 h-3.5 rotate-180" />
                                    Importer un fichier photo
                                    <input 
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(e, 'add')}
                                      className="hidden"
                                    />
                                  </label>
                                  {addForm.image.startsWith('data:image/') && (
                                    <div className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/20 px-2 py-1 rounded-lg">
                                      <img src={addForm.image} className="w-6 h-6 object-contain rounded" alt="" />
                                      <button 
                                        type="button" 
                                        onClick={() => setAddForm(prev => ({ ...prev, image: '' }))}
                                        className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase cursor-pointer"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 col-span-2">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Variantes (séparées par des virgules)</label>
                              <input 
                                type="text"
                                value={addForm.variantesStr}
                                onChange={(e) => setAddForm(prev => ({ ...prev, variantesStr: e.target.value }))}
                                placeholder="ex: normale, reverse, holo"
                                className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <button 
                            type="submit"
                            className="w-full mt-2 py-2 rounded-lg bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 transition-colors cursor-pointer"
                          >
                            Enregistrer la carte
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Fast Search & Filters Dock */}
              <div className={`flex flex-col gap-2 border rounded-xl p-3 transition-colors duration-300 ${
                isLightMode ? 'bg-zinc-50/70 border-zinc-200' : 'bg-zinc-950/30 border-zinc-900'
              }`}>
                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou numéro..."
                    className={`w-full border rounded-lg py-2 pl-9.5 pr-4 text-xs transition-colors focus:outline-none focus:border-indigo-500/50 ${
                      isLightMode 
                        ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400' 
                        : 'bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-500'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      id="btn-clear-search"
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
                        isLightMode ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      Vider
                    </button>
                  )}
                </div>

                {/* Filter Switchers */}
                <div className="flex gap-1.5 pt-1">
                  {[
                    { mode: 'all', label: 'Toutes' },
                    { mode: 'missing', label: 'Manquantes' },
                    { mode: 'owned', label: 'Possédées' }
                  ].map((f) => (
                    <button
                      key={f.mode}
                      id={`btn-filter-${f.mode}`}
                      onClick={() => setFilterMode(f.mode as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                        filterMode === f.mode
                          ? isLightMode
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                            : 'bg-zinc-100 text-black border-white'
                          : isLightMode
                            ? 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                            : 'bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort Option Control Bar */}
                <div className={`flex items-center justify-between pt-2 mt-1 border-t transition-colors duration-300 ${
                  isLightMode ? 'border-zinc-200' : 'border-zinc-900/60'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLightMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Trier les cartes par :</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      id="btn-sort-date"
                      onClick={() => setSortMode('date')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                        sortMode === 'date'
                          ? 'bg-indigo-600/20 text-indigo-500 border-indigo-500/30'
                          : isLightMode
                            ? 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800'
                            : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      Date d'ajout
                    </button>
                    <button
                      type="button"
                      id="btn-sort-number"
                      onClick={() => setSortMode('number')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                        sortMode === 'number'
                          ? 'bg-indigo-600/20 text-indigo-500 border-indigo-500/30'
                          : isLightMode
                            ? 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800'
                            : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      Numéro (0-9)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Checklist Render */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-1">
                {activeCardsList.length > 0 ? (
                  activeCardsList.map((card) => {
                    const cardKey = `${card.set}::${card.numero}`;
                    const originalList = cardLists[currentSubCategory] || [];
                    const absoluteIndex = originalList.findIndex(c => c.set === card.set && c.numero === card.numero);
                    const canMoveUp = absoluteIndex > 0;
                    const canMoveDown = absoluteIndex !== -1 && absoluteIndex < originalList.length - 1;

                    return (
                      <TCGCard
                        key={cardKey}
                        card={card}
                        possession={possession}
                        onToggle={(variant) => handleToggleVariant(card, variant)}
                        isEditMode={isEditMode}
                        isEditing={editingCardKey === cardKey}
                        onEdit={() => setEditingCardKey(cardKey)}
                        onCancel={() => setEditingCardKey(null)}
                        onSave={(updatedCard) => {
                          handleUpdateCardByKey(card.set, card.numero, updatedCard);
                          setEditingCardKey(null);
                        }}
                        onMoveUp={() => handleMoveCardByKey(card.set, card.numero, 'up')}
                        onMoveDown={() => handleMoveCardByKey(card.set, card.numero, 'down')}
                        onDelete={() => handleDeleteCardByKey(card.set, card.numero)}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                        isLightMode={isLightMode}
                      />
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-zinc-950/20 border border-dashed border-zinc-850 rounded-2xl">
                    <Filter className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
                    <span className="text-zinc-400 text-xs font-bold">Aucune carte trouvée</span>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
                      Ajustez vos filtres ou la recherche pour afficher d'autres cartes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* --- GLOBAL BOTTOM NAVBAR --- */}
        <nav className={`fixed bottom-0 max-w-md w-full backdrop-blur-md px-6 py-2.5 flex justify-around items-center z-50 border-t transition-colors duration-300 ${
          isLightMode ? 'bg-white/95 border-zinc-200' : 'bg-[#0c0c0e]/95 border-zinc-900/80'
        }`}>
          <button
            id="nav-home"
            onClick={() => navigateToCategory('home', 'home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors active:scale-95 cursor-pointer ${
              currentCategory === 'home' 
                ? 'text-indigo-500' 
                : isLightMode 
                  ? 'text-zinc-400 hover:text-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          <button
            id="nav-pokemon"
            onClick={() => navigateToCategory('pokemon', 'home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors active:scale-95 cursor-pointer ${
              currentCategory === 'pokemon' 
                ? 'text-indigo-500' 
                : isLightMode 
                  ? 'text-zinc-400 hover:text-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <PokeballIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Pokémon</span>
          </button>

          <button
            id="nav-dragonball"
            onClick={() => navigateToCategory('dragonball', 'home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors active:scale-95 cursor-pointer ${
              currentCategory === 'dragonball' 
                ? 'text-amber-500' 
                : isLightMode 
                  ? 'text-zinc-400 hover:text-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <DragonBallOneStarIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Dragon Ball</span>
          </button>
        </nav>

        {/* --- DUAL CONFIRM RESET MODAL --- */}
        {showResetConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 w-full max-w-xs text-center shadow-2xl flex flex-col gap-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <RotateCcw className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-display font-bold text-sm text-white">Tout effacer ?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cette action réinitialisera l'intégralité de votre collection à zéro. Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  id="btn-reset-cancel"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 active:scale-95 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-reset-confirm"
                  onClick={handleResetCollection}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white active:scale-95 cursor-pointer"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
