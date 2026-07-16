import { Card } from '../types';
import brutalibre from './pokemon/masterset/brutalibre.json';
import tarinorme from './pokemon/masterset/tarinorme.json';
import psykokwak from './pokemon/masterset/psykokwak.json';
import herosTranscendants from './pokemon/fullsets/heros-transcendants.json';
import chaosAscendant from './pokemon/fullsets/chaos-ascendant.json';
import fb04 from './dragonball/fb04.json';
import fb09 from './dragonball/fb09.json';

export const ALL_DATA: Record<string, Card[]> = {
  masterset_brutalibre: brutalibre as Card[],
  masterset_tarinorme: tarinorme as Card[],
  masterset_psykokwak: psykokwak as Card[],
  fullset_heros_transcendants: herosTranscendants as Card[],
  fullset_chaos_ascendant: chaosAscendant as Card[],
  db_fb04: fb04 as Card[],
  db_fb09: fb09 as Card[]
};

export const SECTION_LABELS: Record<string, string> = {
  masterset_brutalibre: 'Master Set - Brutalibré',
  masterset_tarinorme: 'Master Set - Tarinorme',
  masterset_psykokwak: 'Master Set - Psykokwak',
  fullset_heros_transcendants: 'Full Set - Héros Transcendants',
  fullset_chaos_ascendant: 'Full Set - Chaos Ascendant',
  db_fb04: 'Dragon Ball - FB04',
  db_fb09: 'Dragon Ball - FB09'
};
