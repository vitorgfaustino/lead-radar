/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * SearchHistoryService.js
 * Serviço de Histórico de Consultas - 100% Estático com LocalStorage
 * Registra e categoriza todas as extrações realizadas pelo usuário
 */

class SearchHistoryService {
    static STORAGE_KEY = 'searchHistory';
    static MAX_SESSIONS = 100; // Máximo de sessões armazenadas
    static MAX_COMPANIES_PER_SESSION = 500; // Máximo de empresas por sessão

    /**
     * Salva uma nova sessão de busca com todos os resultados
     * @param {Object} searchParams - Parâmetros da busca (termo, localização, etc.)
     * @param {Array} results - Array de empresas retornadas
     * @returns {string} ID da sessão criada
     */
    static saveSession(searchParams, results) {
        try {
            const sessions = this.getAllSessions();

            const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Limitar empresas por sessão
            const limitedResults = results.slice(0, this.MAX_COMPANIES_PER_SESSION);

            const session = {
                id: sessionId,
                searchTerm: searchParams.termo || searchParams.searchTerm || '',
                location: searchParams.localizacao || searchParams.location || '',
                maxResults: searchParams.maxResults || limitedResults.length,
                totalFound: results.length,
                savedCount: limitedResults.length,
                companies: limitedResults.map(r => ({
                    placeId: r.placeId,
                    nome: r.nome,
                    endereco: r.endereco,
                    telefone: r.telefone,
                    website: r.website,
                    avaliacao: r.avaliacao,
                    totalAvaliacoes: r.totalAvaliacoes,
                    categoria: r.categoria || r.types?.[0] || '',
                    hasPhoto: r.hasPhoto || false,
                    localizacao: r.localizacao || null,
                    horarios: r.horarios || null
                })),
                createdAt: new Date().toISOString(),
                prospectedCount: 0 // Será atualizado dinamicamente
            };

            // Adicionar no início (mais recente primeiro)
            sessions.unshift(session);

            // Limitar número de sessões
            if (sessions.length > this.MAX_SESSIONS) {
                sessions.splice(this.MAX_SESSIONS);
            }

            this._saveSessions(sessions);
            return sessionId;
        } catch (error) {
            console.error('Erro ao salvar sessão de busca:', error);
            return null;
        }
    }

    /**
     * Obtém todas as sessões armazenadas
     * @returns {Array} Lista de sessões
     */
    static getAllSessions() {
        try {
            return StorageManager.readStoredArray(this.STORAGE_KEY, []);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            return [];
        }
    }

    /**
     * Obtém uma sessão específica por ID
     * @param {string} sessionId
     * @returns {Object|null}
     */
    static getSession(sessionId) {
        const sessions = this.getAllSessions();
        return sessions.find(s => s.id === sessionId) || null;
    }

    /**
     * Remove uma sessão
     * @param {string} sessionId
     * @returns {boolean}
     */
    static deleteSession(sessionId) {
        const sessions = this.getAllSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        if (filtered.length === sessions.length) return false;
        this._saveSessions(filtered);
        return true;
    }

    /**
     * Limpa todo o histórico
     */
    static clearAll() {
        StorageManager.writeStoredValue(this.STORAGE_KEY, null);
    }

    /**
    * LeadRadar: busca empresas em todas as sessões por termo
     * @param {string} query - Termo de busca
     * @returns {Array} Empresas encontradas com info da sessão
     */
    static searchCompanies(query) {
        const sessions = this.getAllSessions();
        const results = [];
        const queryLower = query.toLowerCase();

        sessions.forEach(session => {
            session.companies.forEach(company => {
                if (
                    company.nome.toLowerCase().includes(queryLower) ||
                    company.endereco.toLowerCase().includes(queryLower) ||
                    (company.categoria && company.categoria.toLowerCase().includes(queryLower))
                ) {
                    results.push({
                        ...company,
                        sessionId: session.id,
                        sessionTerm: session.searchTerm,
                        sessionLocation: session.location,
                        sessionDate: session.createdAt
                    });
                }
            });
        });

        return results;
    }

    /**
     * Obtém todas as empresas únicas de todas as sessões
     * @param {Object} filters - Filtros opcionais
     * @returns {Array}
     */
    static getAllCompanies(filters = {}) {
        const sessions = this.getAllSessions();
        const seen = new Set();
        const companies = [];

        sessions.forEach(session => {
            session.companies.forEach(company => {
                if (!seen.has(company.placeId)) {
                    seen.add(company.placeId);
                    const isProspected = window.prospectedPlaces
                        ? window.prospectedPlaces.has(company.placeId)
                        : false;

                    const entry = {
                        ...company,
                        sessionId: session.id,
                        sessionTerm: session.searchTerm,
                        sessionLocation: session.location,
                        sessionDate: session.createdAt,
                        isProspected
                    };

                    // Aplicar filtros
                    if (filters.onlyProspected && !isProspected) return;
                    if (filters.onlyNotProspected && isProspected) return;
                    if (filters.noWebsite && company.website && company.website !== 'Não disponível') return;
                    if (filters.searchTerm) {
                        const q = filters.searchTerm.toLowerCase();
                        if (
                            !company.nome.toLowerCase().includes(q) &&
                            !company.endereco.toLowerCase().includes(q)
                        ) return;
                    }
                    if (filters.sessionId && session.id !== filters.sessionId) return;

                    companies.push(entry);
                }
            });
        });

        return companies;
    }

    /**
     * Obtém estatísticas gerais do histórico
     * @returns {Object}
     */
    static getStats() {
        const sessions = this.getAllSessions();
        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                totalCompanies: 0,
                uniqueCompanies: 0,
                prospectedCount: 0,
                noWebsiteCount: 0,
                topTerms: [],
                lastSearch: null
            };
        }

        const seen = new Set();
        let totalCompanies = 0;
        let noWebsiteCount = 0;
        const termCounts = {};

        sessions.forEach(session => {
            totalCompanies += session.companies.length;

            // Contar termos
            const term = session.searchTerm || 'Sem termo';
            termCounts[term] = (termCounts[term] || 0) + session.companies.length;

            session.companies.forEach(company => {
                seen.add(company.placeId);
                if (!company.website || company.website === 'Não disponível') {
                    noWebsiteCount++;
                }
            });
        });

        const prospectedCount = window.prospectedPlaces
            ? [...seen].filter(id => window.prospectedPlaces.has(id)).length
            : 0;

        const topTerms = Object.entries(termCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([term, count]) => ({ term, count }));

        return {
            totalSessions: sessions.length,
            totalCompanies,
            uniqueCompanies: seen.size,
            prospectedCount,
            noWebsiteCount,
            topTerms,
            lastSearch: sessions[0]?.createdAt || null
        };
    }

    /**
     * Obtém sessões agrupadas por termo de pesquisa
     * @returns {Object}
     */
    static getSessionsByTerm() {
        const sessions = this.getAllSessions();
        const grouped = {};

        sessions.forEach(session => {
            const term = session.searchTerm || 'Sem termo';
            if (!grouped[term]) {
                grouped[term] = {
                    term,
                    sessions: [],
                    totalCompanies: 0,
                    locations: new Set()
                };
            }
            grouped[term].sessions.push(session);
            grouped[term].totalCompanies += session.companies.length;
            if (session.location) {
                grouped[term].locations.add(session.location);
            }
        });

        // Converter Sets para Arrays para serialização
        return Object.values(grouped).map(g => ({
            ...g,
            locations: [...g.locations],
            sessionCount: g.sessions.length
        }));
    }

    /**
     * Exporta histórico completo como JSON
     * @returns {string}
     */
    static exportJSON() {
        const sessions = this.getAllSessions();
        const stats = this.getStats();
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            stats,
            sessions
        }, null, 2);
    }

    /**
     * Exporta todas as empresas como CSV
     * @param {Object} filters - Filtros opcionais
     * @returns {string}
     */
    static exportCSV(filters = {}) {
        const companies = this.getAllCompanies(filters);
        const headers = [
            'Nome', 'Endereço', 'Telefone', 'Website', 'Avaliação',
            'Total Avaliações', 'Categoria', 'Status', 'Termo de Busca',
            'Localização', 'Data da Extração', 'Place ID'
        ];

        const rows = companies.map(c => [
            `"${(c.nome || '').replace(/"/g, '""')}"`,
            `"${(c.endereco || '').replace(/"/g, '""')}"`,
            `"${(c.telefone || '').replace(/"/g, '""')}"`,
            `"${(c.website || '').replace(/"/g, '""')}"`,
            `"${c.avaliacao || ''}"`,
            `"${c.totalAvaliacoes || ''}"`,
            `"${(c.categoria || '').replace(/"/g, '""')}"`,
            `"${c.isProspected ? 'Prospectado' : 'Não Prospectado'}"`,
            `"${(c.sessionTerm || '').replace(/"/g, '""')}"`,
            `"${(c.sessionLocation || '').replace(/"/g, '""')}"`,
            `"${c.sessionDate ? new Date(c.sessionDate).toLocaleDateString('pt-BR') : ''}"`,
            `"${c.placeId || ''}"`
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    /**
     * Salva sessões no localStorage
     * @private
     */
    static _saveSessions(sessions) {
        try {
            StorageManager.writeStoredArray(this.STORAGE_KEY, sessions);
        } catch (error) {
            // Se localStorage estiver cheio, remover sessões mais antigas
            if (error.name === 'QuotaExceededError') {
                const trimmed = sessions.slice(0, Math.floor(sessions.length / 2));
                StorageManager.writeStoredArray(this.STORAGE_KEY, trimmed);
                console.warn('localStorage cheio: removidas sessões antigas');
            }
        }
    }
}

window.SearchHistoryService = SearchHistoryService;
