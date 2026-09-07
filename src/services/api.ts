import {
  Masa,
  MasaStats,
  Evento,
  AuthMe,
  SystemStatus,
  MasanielloCalculation,
  BBPlayer,
  BBArena,
  BBEconomy,
  BBMatch,
  BBMinute,
  BBPlayerStat,
  BBDashboardData,
  BBUser,
  AndaCategory,
  AndaRecipe,
  AndaRecipeDetail,
  AndaOverview,
  AndaIngredient
} from '../types';

// Gestione utente simulato/header per test preview o basic auth
const STORAGE_KEY_USER = 'masa_simulated_user';
const STORAGE_KEY_BASIC = 'masa_basic_auth';

export function getSimulatedUser(): string {
  return localStorage.getItem(STORAGE_KEY_USER) || '';
}

export function setSimulatedUser(username: string) {
  if (username) {
    localStorage.setItem(STORAGE_KEY_USER, username);
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}

export function getBasicAuth(): string {
  return localStorage.getItem(STORAGE_KEY_BASIC) || '';
}

export function setBasicAuth(authBase64: string) {
  if (authBase64) {
    localStorage.setItem(STORAGE_KEY_BASIC, authBase64);
  } else {
    localStorage.removeItem(STORAGE_KEY_BASIC);
  }
}

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const simUser = getSimulatedUser();
  if (simUser) {
    headers['x-user-override'] = simUser;
  }

  const basic = getBasicAuth();
  if (basic) {
    headers['Authorization'] = `Basic ${basic}`;
  }

  return headers;
}

export const api = {
  // Auth
  async getAuthMe(): Promise<AuthMe> {
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero sessione auth');
    return res.json();
  },

  // System
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero stato del sistema');
    return res.json();
  },

  async exportBackup(): Promise<any> {
    const res = await fetch('/api/system/export', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore durante l\'export');
    return res.json();
  },

  async importBackup(data: { masas: Masa[]; eventi: Evento[]; overwrite?: boolean }): Promise<{ ok: boolean; message: string }> {
    const res = await fetch('/api/system/import', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore durante l\'import');
    }
    return res.json();
  },

  // Masa CRUD
  async getMasas(attivo?: number): Promise<MasaStats[]> {
    const url = attivo !== undefined ? `/api/masa?attivo=${attivo}` : '/api/masa';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero lista Masaniello');
    return res.json();
  },

  async getMasa(id: number): Promise<MasaStats> {
    const res = await fetch(`/api/masa/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Masaniello non trovato');
    return res.json();
  },

  async createMasa(data: {
    nome: string;
    n_eventi: number;
    eventi_attesi: number;
    capitale: number;
    masa1?: number;
    masa2?: number;
    attivo?: number;
    autoGenerateSteps?: boolean;
    defaultQuota?: number;
  }): Promise<MasaStats> {
    const res = await fetch('/api/masa', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella creazione del Masaniello');
    }
    return res.json();
  },

  async updateMasa(id: number, data: Partial<Masa>): Promise<MasaStats> {
    const res = await fetch(`/api/masa/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore aggiornamento Masaniello');
    }
    return res.json();
  },

  async deleteMasa(id: number): Promise<{ ok: boolean; message: string }> {
    const res = await fetch(`/api/masa/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore eliminazione Masaniello');
    }
    return res.json();
  },

  async resetMasa(id: number): Promise<MasaStats> {
    const res = await fetch(`/api/masa/${id}/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore reset Masaniello');
    }
    return res.json();
  },

  async calculateNextStake(id: number, quota: number): Promise<MasanielloCalculation> {
    const res = await fetch(`/api/masa/${id}/calculate-next`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quota }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nel calcolo puntata');
    }
    return res.json();
  },

  // Eventi CRUD
  async addEvento(masaId: number, data: Partial<Evento>): Promise<Evento> {
    const res = await fetch(`/api/masa/${masaId}/eventi`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore aggiunta evento');
    }
    return res.json();
  },

  async updateEvento(
    eventoId: number,
    data: Partial<Evento> & { recalcNext?: boolean }
  ): Promise<{ evento: Evento; masa: MasaStats }> {
    const res = await fetch(`/api/eventi/${eventoId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore aggiornamento evento');
    }
    return res.json();
  },

  async deleteEvento(eventoId: number): Promise<{ ok: boolean; masa: MasaStats }> {
    const res = await fetch(`/api/eventi/${eventoId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore cancellazione evento');
    }
    return res.json();
  },

  // BuzzerBeater Basketball Manager
  async getBBUsers(): Promise<BBUser[]> {
    const res = await fetch('/api/bbeater/users', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero lista utenti BuzzerBeater');
    return res.json();
  },

  async getBBDashboard(user?: string): Promise<BBDashboardData> {
    const query = user ? `?user=${encodeURIComponent(user)}` : '';
    const res = await fetch(`/api/bbeater/dashboard${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero dashboard BuzzerBeater');
    return res.json();
  },

  async getBBRoster(user?: string): Promise<BBPlayer[]> {
    const query = user ? `?user=${encodeURIComponent(user)}` : '';
    const res = await fetch(`/api/bbeater/roster${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero roster');
    return res.json();
  },

  async createBBPlayer(data: Partial<BBPlayer>, user?: string): Promise<BBPlayer> {
    const query = user ? `?user=${encodeURIComponent(user)}` : '';
    const res = await fetch(`/api/bbeater/roster${query}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella creazione del giocatore');
    }
    return res.json();
  },

  async updateBBPlayer(id: number, data: Partial<BBPlayer>): Promise<BBPlayer> {
    const res = await fetch(`/api/bbeater/roster/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'aggiornamento del giocatore');
    }
    return res.json();
  },

  async deleteBBPlayer(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/bbeater/roster/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella rimozione del giocatore');
    }
    return res.json();
  },

  async getBBMinutes(): Promise<BBMinute[]> {
    const res = await fetch('/api/bbeater/minutes', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero minuti giocati');
    return res.json();
  },

  async updateBBMinutes(data: { playerid: string; minuti_giocati: number; player_name?: string; position?: string }): Promise<{ ok: boolean }> {
    const res = await fetch('/api/bbeater/minutes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'aggiornamento minuti');
    }
    return res.json();
  },

  async getBBMatches(): Promise<BBMatch[]> {
    const res = await fetch('/api/bbeater/matches', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero partite');
    return res.json();
  },

  async createBBMatch(data: Partial<BBMatch>): Promise<{ ok: boolean }> {
    const res = await fetch('/api/bbeater/matches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella registrazione partita');
    }
    return res.json();
  },

  async getBBArena(): Promise<BBArena> {
    const res = await fetch('/api/bbeater/arena', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero palazzetto');
    return res.json();
  },

  async updateBBArena(data: Partial<BBArena>): Promise<BBArena> {
    const res = await fetch('/api/bbeater/arena', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'aggiornamento palazzetto');
    }
    return res.json();
  },

  async getBBEconomy(): Promise<BBEconomy> {
    const res = await fetch('/api/bbeater/economy', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero dati economici');
    return res.json();
  },

  async getBBStats(): Promise<BBPlayerStat[]> {
    const res = await fetch('/api/bbeater/stats', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero statistiche');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // AnDa - Ricettario & Calcolatori Parametrici
  // --------------------------------------------------------------------------
  async getAndaOverview(): Promise<AndaOverview> {
    const res = await fetch('/api/anda/overview', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero dati AnDa');
    return res.json();
  },

  async getAndaCategories(): Promise<AndaCategory[]> {
    const res = await fetch('/api/anda/categories', { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero categorie AnDa');
    return res.json();
  },

  async createAndaCategory(data: Partial<AndaCategory>): Promise<AndaCategory> {
    const res = await fetch('/api/anda/categories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella creazione categoria');
    }
    return res.json();
  },

  async updateAndaCategory(id: number, data: Partial<AndaCategory>): Promise<AndaCategory> {
    const res = await fetch(`/api/anda/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'aggiornamento categoria');
    }
    return res.json();
  },

  async deleteAndaCategory(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/anda/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'eliminazione categoria');
    }
    return res.json();
  },

  async getAndaRecipes(params?: { category_id?: number; category_slug?: string; search?: string; parametric?: number }): Promise<AndaRecipe[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.category_slug) query.set('category_slug', params.category_slug);
    if (params?.search) query.set('search', params.search);
    if (params?.parametric !== undefined) query.set('parametric', String(params.parametric));

    const url = `/api/anda/recipes${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero ricette AnDa');
    return res.json();
  },

  async getAndaRecipeDetail(id: number): Promise<AndaRecipeDetail> {
    const res = await fetch(`/api/anda/recipes/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Errore nel recupero ricetta AnDa');
    return res.json();
  },

  async createAndaRecipe(data: any): Promise<AndaRecipe> {
    const res = await fetch('/api/anda/recipes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nella creazione ricetta');
    }
    return res.json();
  },

  async updateAndaRecipe(id: number, data: any): Promise<AndaRecipe> {
    const res = await fetch(`/api/anda/recipes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'aggiornamento ricetta');
    }
    return res.json();
  },

  async deleteAndaRecipe(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`/api/anda/recipes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nell\'eliminazione ricetta');
    }
    return res.json();
  },

  async scaleAndaRecipe(id: number, multiplier: number): Promise<{ recipe_id: number; multiplier: number; ingredients: AndaIngredient[] }> {
    const res = await fetch(`/api/anda/recipes/${id}/scale`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ multiplier }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Errore nel calcolo scalatura');
    }
    return res.json();
  },
};
