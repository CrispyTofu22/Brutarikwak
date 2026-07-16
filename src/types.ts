export interface Card {
  nom: string;
  numero: string;
  set: string;
  langue: string;
  image: string;
  rarete: string;
  variantes: string[];
  possede?: {
    [variante: string]: boolean;
  };
  createdAt?: number;
}

export type Category = 'home' | 'pokemon' | 'dragonball';

export type SubCategory = 
  | 'home'
  | 'masterset_brutalibre'
  | 'masterset_tarinorme'
  | 'masterset_psykokwak'
  | 'fullset_heros_transcendants'
  | 'fullset_chaos_ascendant'
  | 'db_fb04'
  | 'db_fb09';

export interface PossessionState {
  // Key format: `${set}::${numero}::${variant}` -> boolean
  [key: string]: boolean;
}
