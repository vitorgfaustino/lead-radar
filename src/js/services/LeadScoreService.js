/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Serviço de Score de Lead - 100% Estático
 * Calcula pontuação automática baseada em dados disponíveis
 */

class LeadScoreService {
    static SCORE_STORAGE_KEY = 'leadScores';
    static SCORE_CONFIG_KEY = 'leadScoreConfig';
    
    static DEFAULT_CONFIG = {
        weights: {
            rating: 25,           // Avaliação do Google
            reviews: 20,          // Número de avaliações
            website: 15,          // Tem website
            phone: 10,            // Tem telefone
            photos: 5,            // Tem fotos
            addressComplete: 10,  // Endereço completo
            businessHours: 5,     // Horários disponíveis
            categoryMatch: 10     // Match com categoria buscada
        },
        thresholds: {
            hot: 70,
            warm: 40,
            cold: 0
        },
        categories: {
            'restaurant': { boost: 10 },
            'hotel': { boost: 8 },
            'store': { boost: 5 },
            'service': { boost: 7 },
            'default': { boost: 0 }
        }
    };

    /**
     * Inicializa configuração
     */
    static initialize() {
        const existingConfig = this.getConfig();
        if (!existingConfig) {
            this.saveConfig(this.DEFAULT_CONFIG);
        }
    }

    /**
     * Obtém configuração
     */
    static getConfig() {
        try {
            return StorageManager.readStoredObject(this.SCORE_CONFIG_KEY, null);
        } catch (error) {
            console.error('Erro ao carregar configuração:', error);
            return null;
        }
    }

    /**
     * Salva configuração
     */
    static saveConfig(config) {
        try {
            StorageManager.writeStoredObject(this.SCORE_CONFIG_KEY, config);
            return true;
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            return false;
        }
    }

    /**
     * Calcula score para um lead
     */
    static calculateScore(lead, searchCategory = '') {
        const config = this.getConfig() || this.DEFAULT_CONFIG;
        let totalScore = 0;
        const breakdown = {};
        
        // 1. Avaliação (0-5 stars)
        if (lead.rating && lead.rating !== 'Não avaliado') {
            const rating = parseFloat(lead.rating);
            if (!isNaN(rating)) {
                const ratingScore = (rating / 5) * config.weights.rating;
                totalScore += ratingScore;
                breakdown.rating = {
                    value: rating,
                    score: ratingScore,
                    max: config.weights.rating
                };
            }
        }
        
        // 2. Número de avaliações
        if (lead.totalAvaliacoes && lead.totalAvaliacoes !== 'N/A') {
            const reviews = parseInt(lead.totalAvaliacoes.replace(/,/g, ''));
            if (!isNaN(reviews)) {
                let reviewScore = 0;
                if (reviews > 1000) reviewScore = config.weights.reviews;
                else if (reviews > 500) reviewScore = config.weights.reviews * 0.8;
                else if (reviews > 100) reviewScore = config.weights.reviews * 0.6;
                else if (reviews > 50) reviewScore = config.weights.reviews * 0.4;
                else if (reviews > 10) reviewScore = config.weights.reviews * 0.2;
                
                totalScore += reviewScore;
                breakdown.reviews = {
                    value: reviews,
                    score: reviewScore,
                    max: config.weights.reviews
                };
            }
        }
        
        // 3. Website
        if (lead.website && lead.website !== 'Não disponível') {
            totalScore += config.weights.website;
            breakdown.website = {
                value: true,
                score: config.weights.website,
                max: config.weights.website
            };
        }
        
        // 4. Telefone
        if (lead.telefone && lead.telefone !== 'Não disponível') {
            totalScore += config.weights.phone;
            breakdown.phone = {
                value: true,
                score: config.weights.phone,
                max: config.weights.phone
            };
        }
        
        // 5. Fotos
        if (lead.hasPhoto) {
            totalScore += config.weights.photos;
            breakdown.photos = {
                value: true,
                score: config.weights.photos,
                max: config.weights.photos
            };
        }
        
        // 6. Endereço completo
        if (lead.endereco && 
            lead.endereco.includes(',') && 
            lead.endereco.length > 20) {
            totalScore += config.weights.addressComplete;
            breakdown.addressComplete = {
                value: true,
                score: config.weights.addressComplete,
                max: config.weights.addressComplete
            };
        }
        
        // 7. Horários disponíveis
        if (lead.horarios && lead.horarios !== 'Não disponível') {
            totalScore += config.weights.businessHours;
            breakdown.businessHours = {
                value: true,
                score: config.weights.businessHours,
                max: config.weights.businessHours
            };
        }
        
        // 8. Match de categoria
        if (searchCategory && lead.categoria) {
            const searchLower = searchCategory.toLowerCase();
            const categoryLower = lead.categoria.toLowerCase();
            
            if (categoryLower.includes(searchLower) || searchLower.includes(categoryLower)) {
                totalScore += config.weights.categoryMatch;
                breakdown.categoryMatch = {
                    value: true,
                    score: config.weights.categoryMatch,
                    max: config.weights.categoryMatch
                };
            }
        }
        
        // 9. Boost por categoria específica
        if (lead.categoria) {
            const categoryKey = Object.keys(config.categories).find(key => 
                lead.categoria.toLowerCase().includes(key)
            ) || 'default';
            
            const boost = config.categories[categoryKey]?.boost || 0;
            if (boost > 0) {
                totalScore += boost;
                breakdown.categoryBoost = {
                    category: categoryKey,
                    score: boost,
                    max: boost
                };
            }
        }
        
        // Garantir que score não ultrapasse 100
        totalScore = Math.min(totalScore, 100);
        
        // Determinar status
        const status = this.getStatusFromScore(totalScore, config);
        
        return {
            score: Math.round(totalScore),
            status,
            breakdown,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Obtém status baseado no score
     */
    static getStatusFromScore(score, config = null) {
        const cfg = config || this.getConfig() || this.DEFAULT_CONFIG;
        const thresholds = cfg.thresholds;
        
        if (score >= thresholds.hot) return 'hot';
        if (score >= thresholds.warm) return 'warm';
        return 'cold';
    }

    /**
     * Salva score para um lead
     */
    static saveScore(leadId, scoreData) {
        try {
            const allScores = this.getAllScores();
            allScores[leadId] = {
                ...scoreData,
                leadId,
                updatedAt: new Date().toISOString()
            };
            
            StorageManager.writeStoredObject(this.SCORE_STORAGE_KEY, allScores);
            return true;
        } catch (error) {
            console.error('Erro ao salvar score:', error);
            return false;
        }
    }

    /**
     * Obtém todos os scores
     */
    static getAllScores() {
        try {
            return StorageManager.readStoredObject(this.SCORE_STORAGE_KEY, {});
        } catch (error) {
            console.error('Erro ao carregar scores:', error);
            return {};
        }
    }

    /**
     * Obtém score de um lead
     */
    static getScore(leadId) {
        const allScores = this.getAllScores();
        return allScores[leadId] || null;
    }

    /**
     * Atualiza score com novos dados
     */
    static updateScore(leadId, leadData, searchCategory = '') {
        const scoreData = this.calculateScore(leadData, searchCategory);
        return this.saveScore(leadId, scoreData);
    }

    /**
     * Obtém leads por status
     */
    static getLeadsByStatus(status) {
        const allScores = this.getAllScores();
        const filtered = {};
        
        Object.entries(allScores).forEach(([leadId, scoreData]) => {
            if (scoreData.status === status) {
                filtered[leadId] = scoreData;
            }
        });
        
        return filtered;
    }

    /**
     * Obtém leads ordenados por score
     */
    static getLeadsSortedByScore(limit = 50) {
        const allScores = this.getAllScores();
        const sorted = Object.entries(allScores)
            .map(([leadId, scoreData]) => ({ leadId, ...scoreData }))
            .sort((a, b) => b.score - a.score);
        
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Obtém estatísticas
     */
    static getStats() {
        const allScores = this.getAllScores();
        const scores = Object.values(allScores);
        
        if (scores.length === 0) {
            return {
                total: 0,
                averageScore: 0,
                byStatus: { hot: 0, warm: 0, cold: 0 },
                topScore: 0,
                lastUpdated: null
            };
        }
        
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const averageScore = Math.round(totalScore / scores.length);
        
        const byStatus = {
            hot: scores.filter(s => s.status === 'hot').length,
            warm: scores.filter(s => s.status === 'warm').length,
            cold: scores.filter(s => s.status === 'cold').length
        };
        
        const topScore = Math.max(...scores.map(s => s.score));
        const lastUpdated = new Date(Math.max(...scores.map(s => new Date(s.updatedAt || s.calculatedAt).getTime())));
        
        return {
            total: scores.length,
            averageScore,
            byStatus,
            topScore,
            lastUpdated: lastUpdated.toISOString(),
            distribution: {
                hot: Math.round((byStatus.hot / scores.length) * 100),
                warm: Math.round((byStatus.warm / scores.length) * 100),
                cold: Math.round((byStatus.cold / scores.length) * 100)
            }
        };
    }

    /**
     * Gera recomendação baseada no score
     */
    static getRecommendation(scoreData) {
        const { score, status } = scoreData;
        
        const recommendations = {
            hot: [
                "Lead quente - Contatar imediatamente",
                "Alta probabilidade de conversão",
                "Prioridade máxima - Agendar reunião esta semana"
            ],
            warm: [
                "Lead promissor - Adicionar à sequência de follow-up",
                "Coletar mais informações antes de contato direto",
                "Considerar abordagem por email primeiro"
            ],
            cold: [
                "Lead de baixa prioridade - Considerar nurturing por conteúdo",
                "Manter em lista para contato futuro"
            ]
        };
        
        const actions = {
            hot: [
                "Ligar dentro de 24 horas",
                "Enviar email personalizado",
                "Conectar no LinkedIn",
                "Agendar demonstração"
            ],
            warm: [
                "Adicionar à sequência automática",
                "Enviar conteúdo relevante",
                "Seguir nas redes sociais",
                "Monitorar por mudanças"
            ],
            cold: [
                "Adicionar à newsletter",
                "Segmentar para campanhas genéricas",
                "Revisitar em 30 dias",
                "Coletar mais dados se possível"
            ]
        };
        
        const randomRec = recommendations[status][Math.floor(Math.random() * recommendations[status].length)];
        const randomAction = actions[status][Math.floor(Math.random() * actions[status].length)];
        
        return {
            recommendation: randomRec,
            suggestedAction: randomAction,
            priority: status === 'hot' ? 'high' : status === 'warm' ? 'medium' : 'low',
            followUpDays: status === 'hot' ? 1 : status === 'warm' ? 3 : 7
        };
    }

    /**
     * Exporta scores
     */
    static exportScores() {
        const scores = this.getAllScores();
        const stats = this.getStats();
        
        return JSON.stringify({
            scores,
            stats,
            exportedAt: new Date().toISOString(),
            totalLeads: Object.keys(scores).length
        }, null, 2);
    }

    /**
     * Limpa scores antigos
     */
    static cleanupOldScores(daysOld = 90) {
        const allScores = this.getAllScores();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        
        const filtered = {};
        let removed = 0;
        
        Object.entries(allScores).forEach(([leadId, scoreData]) => {
            const updated = new Date(scoreData.updatedAt || scoreData.calculatedAt);
            if (updated >= cutoff) {
                filtered[leadId] = scoreData;
            } else {
                removed++;
            }
        });
        
        StorageManager.writeStoredObject(this.SCORE_STORAGE_KEY, filtered);
        
        return {
            removed,
            remaining: Object.keys(filtered).length,
            cutoff: cutoff.toISOString()
        };
    }

    /**
     * Obtém badge color baseado no status
     */
    static getStatusColor(status) {
        const colors = {
            hot: '#EF4444',    // Red-500
            warm: '#F59E0B',   // Amber-500
            cold: '#6B7280'    // Gray-500
        };
        return colors[status] || '#6B7280';
    }

    /**
     * Obtém badge text baseado no status
     */
    static getStatusText(status) {
        const texts = {
            hot: 'Quente',
            warm: 'Morno',
            cold: 'Frio'
        };
        return texts[status] || 'Desconhecido';
    }

    /**
     * Obtém texto do Score (Alto/Médio/Baixo)
     */
    static getScoreText(status) {
        const texts = {
            hot: 'Alto',
            warm: 'Médio',
            cold: 'Baixo'
        };
        return texts[status] || 'Desconhecido';
    }
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    LeadScoreService.initialize();
});

// Exportar globalmente
window.LeadScoreService = LeadScoreService;