/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Serviço de Templates de Email - 100% Estático
 * Armazena templates no localStorage com criptografia
 */

class EmailTemplateService {
    static STORAGE_KEY = 'emailTemplates';
    static DEFAULT_TEMPLATES = [
        {
            id: 'template-1',
            name: 'Primeiro Contato',
            subject: 'Parceria com {{empresa}}',
            body: `Olá {{contato}},\n\nMeu nome é {{seu_nome}} e trabalho com {{seu_cargo}} na {{sua_empresa}}.\n\nEncontrei a {{empresa}} durante minha pesquisa e fiquei impressionado com o trabalho de vocês no segmento de {{segmento}}.\n\nGostaria de explorar possibilidades de parceria que possam beneficiar ambas as empresas.\n\nVocê teria disponibilidade para uma breve conversa na próxima semana?\n\nAtenciosamente,\n{{seu_nome}}\n{{seu_cargo}}\n{{sua_empresa}}`,
            variables: ['empresa', 'contato', 'segmento', 'seu_nome', 'seu_cargo', 'sua_empresa'],
            category: 'first-contact',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'template-2',
            name: 'Follow-up',
            subject: 'Seguindo sobre {{assunto}}',
            body: `Olá {{contato}},\n\nEspero que esteja bem.\n\nEstou entrando em contato novamente para seguir sobre nossa conversa anterior sobre {{assunto}}.\n\nGostaria de saber se você teve a chance de considerar a proposta e se há alguma dúvida que eu possa esclarecer.\n\nFico à disposição para agendar uma conversa rápida.\n\nAtenciosamente,\n{{seu_nome}}`,
            variables: ['contato', 'assunto', 'seu_nome'],
            category: 'follow-up',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'template-3',
            name: 'Apresentação de Solução',
            subject: 'Solução para {{problema}}',
            body: `Olá {{contato}},\n\nAnalisando o perfil da {{empresa}}, identifiquei que vocês podem estar enfrentando desafios relacionados a {{problema}}.\n\nNossa solução em {{sua_solucao}} tem ajudado empresas similares a:\n• {{beneficio1}}\n• {{beneficio2}}\n• {{beneficio3}}\n\nGostaria de agendar uma demonstração rápida de 15 minutos para mostrar como podemos ajudar.\n\nAtenciosamente,\n{{seu_nome}}\n{{seu_cargo}}`,
            variables: ['contato', 'empresa', 'problema', 'sua_solucao', 'beneficio1', 'beneficio2', 'beneficio3', 'seu_nome', 'seu_cargo'],
            category: 'solution',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    /**
     * Inicializa templates padrão se não existirem
     */
    static initialize() {
        const existing = this.getAllTemplates();
        if (existing.length === 0) {
            this.saveAllTemplates(this.DEFAULT_TEMPLATES);
        }
    }

    /**
     * Obtém todos os templates
     * @returns {Array} Lista de templates
     */
    static getAllTemplates() {
        try {
            const stored = StorageManager.readStoredValue(this.STORAGE_KEY, null);
            if (!stored) return [];

            if (Array.isArray(stored)) {
                return stored;
            }
            
            // Tentar descriptografar com SecurityService se disponível
            if (window.SecurityService) {
                const security = new SecurityService();
                return security.decrypt(stored) || [];
            }
            
            // Fallback para JSON simples
            return [];
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            return [];
        }
    }

    /**
     * Salva todos os templates
     * @param {Array} templates - Lista de templates
     */
    static saveAllTemplates(templates) {
        try {
            // Validar templates
            const validated = templates.map(template => ({
                ...template,
                updatedAt: new Date().toISOString()
            }));
            
            // Criptografar com SecurityService se disponível
            if (window.SecurityService) {
                const security = new SecurityService();
                const encrypted = security.encrypt(validated);
                    StorageManager.writeStoredValue(this.STORAGE_KEY, encrypted);
            } else {
                // Fallback para JSON simples
                    StorageManager.writeStoredArray(this.STORAGE_KEY, validated);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar templates:', error);
            return false;
        }
    }

    /**
     * Adiciona ou atualiza um template
     * @param {Object} template - Template a ser salvo
     * @returns {boolean} Sucesso
     */
    static saveTemplate(template) {
        const templates = this.getAllTemplates();
        const existingIndex = templates.findIndex(t => t.id === template.id);
        
        const templateToSave = {
            ...template,
            id: template.id || `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString(),
            createdAt: template.createdAt || new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            templates[existingIndex] = templateToSave;
        } else {
            templates.push(templateToSave);
        }
        
        return this.saveAllTemplates(templates);
    }

    /**
     * Remove um template
     * @param {string} templateId - ID do template
     * @returns {boolean} Sucesso
     */
    static deleteTemplate(templateId) {
        const templates = this.getAllTemplates();
        const filtered = templates.filter(t => t.id !== templateId);
        
        if (filtered.length === templates.length) {
            return false; // Template não encontrado
        }
        
        return this.saveAllTemplates(filtered);
    }

    /**
     * Obtém template por ID
     * @param {string} templateId - ID do template
     * @returns {Object|null} Template
     */
    static getTemplate(templateId) {
        const templates = this.getAllTemplates();
        return templates.find(t => t.id === templateId) || null;
    }

    /**
     * Renderiza template com variáveis
     * @param {string} templateId - ID do template
     * @param {Object} variables - Variáveis para substituir
     * @returns {Object} Template renderizado com subject e body
     */
    static renderTemplate(templateId, variables = {}) {
        const template = this.getTemplate(templateId);
        if (!template) return null;
        
        let subject = template.subject;
        let body = template.body;
        
        // Substituir variáveis no subject e body
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value || '');
            body = body.replace(regex, value || '');
        });
        
        // Remover variáveis não preenchidas
        const variableRegex = /{{[^}]+}}/g;
        subject = subject.replace(variableRegex, '').trim();
        body = body.replace(variableRegex, '').trim();
        
        return {
            subject,
            body,
            templateName: template.name,
            variablesUsed: Object.keys(variables)
        };
    }

    /**
     * Valida template
     * @param {Object} template - Template a validar
     * @returns {Object} Resultado da validação
     */
    static validateTemplate(template) {
        const errors = [];
        
        if (!template.name || template.name.trim().length < 3) {
            errors.push('Nome do template deve ter pelo menos 3 caracteres');
        }
        
        if (!template.subject || template.subject.trim().length < 5) {
            errors.push('Assunto deve ter pelo menos 5 caracteres');
        }
        
        if (!template.body || template.body.trim().length < 20) {
            errors.push('Corpo do email deve ter pelo menos 20 caracteres');
        }
        
        // Validar variáveis no formato {{variavel}}
        const variableRegex = /{{[^}]+}}/g;
        const subjectVars = (template.subject.match(variableRegex) || []).map(v => v.slice(2, -2));
        const bodyVars = (template.body.match(variableRegex) || []).map(v => v.slice(2, -2));
        
        const allVariables = [...new Set([...subjectVars, ...bodyVars])];
        
        return {
            isValid: errors.length === 0,
            errors,
            variables: allVariables
        };
    }

    /**
     * Exporta templates para JSON
     * @returns {string} JSON dos templates
     */
    static exportTemplates() {
        const templates = this.getAllTemplates();
        return JSON.stringify(templates, null, 2);
    }

    /**
     * Importa templates de JSON
     * @param {string} json - JSON dos templates
     * @returns {Object} Resultado da importação
     */
    static importTemplates(json) {
        try {
            const templates = JSON.parse(json);
            
            // Validar cada template
            const validationResults = templates.map(template => {
                const validation = this.validateTemplate(template);
                return {
                    template: template.name || 'Sem nome',
                    valid: validation.isValid,
                    errors: validation.errors
                };
            });
            
            const invalidTemplates = validationResults.filter(r => !r.valid);
            
            if (invalidTemplates.length > 0) {
                return {
                    success: false,
                    message: `${invalidTemplates.length} templates inválidos encontrados`,
                    details: invalidTemplates
                };
            }
            
            // Salvar templates
            const currentTemplates = this.getAllTemplates();
            const mergedTemplates = [...currentTemplates];
            
            templates.forEach(newTemplate => {
                const existingIndex = mergedTemplates.findIndex(t => t.id === newTemplate.id);
                if (existingIndex >= 0) {
                    mergedTemplates[existingIndex] = newTemplate;
                } else {
                    mergedTemplates.push(newTemplate);
                }
            });
            
            this.saveAllTemplates(mergedTemplates);
            
            return {
                success: true,
                message: `${templates.length} templates importados com sucesso`,
                imported: templates.length,
                total: mergedTemplates.length
            };
        } catch (error) {
            return {
                success: false,
                message: 'Erro ao importar templates: ' + error.message
            };
        }
    }

    /**
     * Obtém estatísticas dos templates
     * @returns {Object} Estatísticas
     */
    static getStats() {
        const templates = this.getAllTemplates();
        const categories = {};
        
        templates.forEach(template => {
            categories[template.category] = (categories[template.category] || 0) + 1;
        });
        
        return {
            total: templates.length,
            categories,
            lastUpdated: templates.length > 0 
                ? new Date(Math.max(...templates.map(t => new Date(t.updatedAt).getTime())))
                : null
        };
    }
}

// Inicializar templates padrão
window.addEventListener('DOMContentLoaded', () => {
    EmailTemplateService.initialize();
});

// Exportar para uso global
window.EmailTemplateService = EmailTemplateService;