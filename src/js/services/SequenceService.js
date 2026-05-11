/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Serviço de Sequências de Contato - 100% Estático
 * Gerencia sequências de follow-up com templates
 */

class SequenceService {
    static STORAGE_KEY = 'contactSequences';
    static SCHEDULE_KEY = 'scheduledActions';
    
    static DEFAULT_SEQUENCES = [
        {
            id: 'sequence-1',
            name: 'Sequência Básica (3 passos)',
            description: 'Sequência simples para primeiro contato',
            steps: [
                {
                    id: 'step-1',
                    order: 1,
                    type: 'email',
                    templateId: 'template-1',
                    delayDays: 0,
                    delayHours: 0,
                    conditions: [],
                    enabled: true
                },
                {
                    id: 'step-2',
                    order: 2,
                    type: 'email',
                    templateId: 'template-2',
                    delayDays: 3,
                    delayHours: 0,
                    conditions: ['no-response'],
                    enabled: true
                },
                {
                    id: 'step-3',
                    order: 3,
                    type: 'call-reminder',
                    delayDays: 7,
                    delayHours: 0,
                    conditions: ['no-response'],
                    enabled: true
                }
            ],
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'sequence-2',
            name: 'Sequência Avançada (5 passos)',
            description: 'Sequência completa com múltiplos canais',
            steps: [
                {
                    id: 'step-1',
                    order: 1,
                    type: 'email',
                    templateId: 'template-1',
                    delayDays: 0,
                    delayHours: 0,
                    enabled: true
                },
                {
                    id: 'step-2',
                    order: 2,
                    type: 'linkedin',
                    message: 'Olá {{contato}}, acabei de enviar um email sobre {{assunto}}. Gostaria de conectar aqui também.',
                    delayDays: 1,
                    delayHours: 2,
                    enabled: true
                },
                {
                    id: 'step-3',
                    order: 3,
                    type: 'email',
                    templateId: 'template-2',
                    delayDays: 3,
                    delayHours: 0,
                    conditions: ['no-response'],
                    enabled: true
                },
                {
                    id: 'step-4',
                    order: 4,
                    type: 'call',
                    notes: 'Ligar para {{contato}} no telefone {{telefone}}',
                    delayDays: 5,
                    delayHours: 10,
                    conditions: ['no-response'],
                    enabled: true
                },
                {
                    id: 'step-5',
                    order: 5,
                    type: 'email',
                    templateId: 'template-3',
                    delayDays: 10,
                    delayHours: 0,
                    conditions: ['no-response'],
                    enabled: true
                }
            ],
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    /**
     * Inicializa sequências padrão
     */
    static initialize() {
        const existing = this.getAllSequences();
        if (existing.length === 0) {
            this.saveAllSequences(this.DEFAULT_SEQUENCES);
        }
        this.initializeScheduler();
    }

    /**
     * Obtém todas as sequências
     */
    static getAllSequences() {
        try {
            const stored = StorageManager.readStoredValue(this.STORAGE_KEY, null);
            if (!stored) return [];

            if (Array.isArray(stored)) {
                return stored;
            }
            
            if (window.SecurityService) {
                const security = new SecurityService();
                return security.decrypt(stored) || [];
            }
            
            return [];
        } catch (error) {
            console.error('Erro ao carregar sequências:', error);
            return [];
        }
    }

    /**
     * Salva todas as sequências
     */
    static saveAllSequences(sequences) {
        try {
            const validated = sequences.map(seq => ({
                ...seq,
                updatedAt: new Date().toISOString()
            }));
            
            if (window.SecurityService) {
                const security = new SecurityService();
                const encrypted = security.encrypt(validated);
                StorageManager.writeStoredValue(this.STORAGE_KEY, encrypted);
            } else {
                StorageManager.writeStoredArray(this.STORAGE_KEY, validated);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar sequências:', error);
            return false;
        }
    }

    /**
     * Adiciona ou atualiza uma sequência
     */
    static saveSequence(sequence) {
        const sequences = this.getAllSequences();
        const existingIndex = sequences.findIndex(s => s.id === sequence.id);
        
        const sequenceToSave = {
            ...sequence,
            id: sequence.id || `sequence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString(),
            createdAt: sequence.createdAt || new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            sequences[existingIndex] = sequenceToSave;
        } else {
            sequences.push(sequenceToSave);
        }
        
        return this.saveAllSequences(sequences);
    }

    /**
     * Remove uma sequência
     */
    static deleteSequence(sequenceId) {
        const sequences = this.getAllSequences();
        const filtered = sequences.filter(s => s.id !== sequenceId);
        
        if (filtered.length === sequences.length) {
            return false;
        }
        
        return this.saveAllSequences(filtered);
    }

    /**
     * Obtém sequência por ID
     */
    static getSequence(sequenceId) {
        const sequences = this.getAllSequences();
        return sequences.find(s => s.id === sequenceId) || null;
    }

    /**
     * Aplica sequência a um lead
     */
    static applyToLead(sequenceId, leadData, startImmediately = true) {
        const sequence = this.getSequence(sequenceId);
        if (!sequence || !sequence.enabled) {
            return { success: false, message: 'Sequência não encontrada ou desativada' };
        }

        const scheduledActions = [];
        const startTime = new Date();
        
        sequence.steps.forEach(step => {
            if (!step.enabled) return;
            
            const actionTime = new Date(startTime);
            actionTime.setDate(actionTime.getDate() + step.delayDays);
            actionTime.setHours(actionTime.getHours() + step.delayHours);
            
            const action = {
                id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sequenceId,
                stepId: step.id,
                leadId: leadData.placeId || leadData.id,
                leadName: leadData.name || leadData.empresa,
                contact: leadData.contact || leadData.contato,
                type: step.type,
                scheduledFor: actionTime.toISOString(),
                status: 'scheduled',
                data: {
                    templateId: step.templateId,
                    variables: {
                        empresa: leadData.name || leadData.empresa,
                        contato: leadData.contact || leadData.contato,
                        telefone: leadData.phone || leadData.telefone,
                        email: leadData.email,
                        segmento: leadData.category || leadData.segmento
                    }
                },
                createdAt: new Date().toISOString()
            };
            
            scheduledActions.push(action);
        });
        
        // Salvar ações agendadas
        this.scheduleActions(scheduledActions);
        
        return {
            success: true,
            message: `Sequência "${sequence.name}" aplicada ao lead`,
            actionsScheduled: scheduledActions.length,
            nextAction: scheduledActions[0]?.scheduledFor
        };
    }

    /**
     * Agenda ações
     */
    static scheduleActions(actions) {
        const existing = this.getScheduledActions();
        const merged = [...existing, ...actions];
        
        // Ordenar por data
        merged.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
        
        // Limitar a 1000 ações para evitar overflow
        if (merged.length > 1000) {
            merged.splice(1000);
        }
        
        this.saveScheduledActions(merged);
        this.setupReminders();
    }

    /**
     * Obtém ações agendadas
     */
    static getScheduledActions() {
        try {
            return StorageManager.readStoredArray(this.SCHEDULE_KEY, []);
        } catch (error) {
            console.error('Erro ao carregar ações agendadas:', error);
            return [];
        }
    }

    /**
     * Salva ações agendadas
     */
    static saveScheduledActions(actions) {
        try {
            StorageManager.writeStoredArray(this.SCHEDULE_KEY, actions);
            return true;
        } catch (error) {
            console.error('Erro ao salvar ações agendadas:', error);
            return false;
        }
    }

    /**
     * Configura lembretes
     */
    static setupReminders() {
        if (!('Notification' in window) || Notification.permission === 'denied') {
            return;
        }
        
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.checkDueActions();
                }
            });
        } else if (Notification.permission === 'granted') {
            this.checkDueActions();
        }
    }

    /**
     * Verifica ações vencidas
     */
    static checkDueActions() {
        const actions = this.getScheduledActions();
        const now = new Date();
        const dueActions = actions.filter(action => 
            action.status === 'scheduled' && 
            new Date(action.scheduledFor) <= now
        );
        
        dueActions.forEach(action => {
            this.showReminder(action);
            action.status = 'due';
            action.checkedAt = new Date().toISOString();
        });
        
        if (dueActions.length > 0) {
            this.saveScheduledActions(actions);
        }
    }

    /**
     * Mostra lembrete
     */
    static showReminder(action) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const notification = new Notification('Porketo - Ação Agendada', {
            body: `É hora de ${this.getActionTypeText(action.type)} com ${action.leadName}`,
            icon: '/src/assets/images/logo.webp',
            tag: `action-${action.id}`,
            requireInteraction: true
        });
        
        notification.onclick = () => {
            window.focus();
            // Aqui poderia abrir o modal do lead
            notification.close();
        };
        
        // Auto-close após 30 segundos
        setTimeout(() => notification.close(), 30000);
    }

    /**
     * Texto para tipo de ação
     */
    static getActionTypeText(type) {
        const types = {
            'email': 'enviar email',
            'call': 'ligar',
            'call-reminder': 'ligar (lembrete)',
            'linkedin': 'conectar no LinkedIn',
            'whatsapp': 'enviar WhatsApp'
        };
        return types[type] || 'realizar ação';
    }

    /**
     * Marca ação como concluída
     */
    static markActionCompleted(actionId, notes = '') {
        const actions = this.getScheduledActions();
        const actionIndex = actions.findIndex(a => a.id === actionId);
        
        if (actionIndex >= 0) {
            actions[actionIndex].status = 'completed';
            actions[actionIndex].completedAt = new Date().toISOString();
            actions[actionIndex].notes = notes;
            this.saveScheduledActions(actions);
            return true;
        }
        
        return false;
    }

    /**
     * Inicializa scheduler
     */
    static initializeScheduler() {
        // Verificar a cada hora
        setInterval(() => this.checkDueActions(), 60 * 60 * 1000);
        
        // Verificar agora
        setTimeout(() => this.checkDueActions(), 5000);
    }

    /**
     * Obtém estatísticas
     */
    static getStats() {
        const sequences = this.getAllSequences();
        const actions = this.getScheduledActions();
        
        const statusCounts = {};
        actions.forEach(action => {
            statusCounts[action.status] = (statusCounts[action.status] || 0) + 1;
        });
        
        return {
            totalSequences: sequences.length,
            totalActions: actions.length,
            statusCounts,
            nextAction: actions.find(a => a.status === 'scheduled')?.scheduledFor
        };
    }

    /**
     * Exporta sequências
     */
    static exportSequences() {
        const sequences = this.getAllSequences();
        return JSON.stringify(sequences, null, 2);
    }

    /**
     * Importa sequências
     */
    static importSequences(json) {
        try {
            const sequences = JSON.parse(json);
            const current = this.getAllSequences();
            const merged = [...current];
            
            sequences.forEach(newSeq => {
                const existingIndex = merged.findIndex(s => s.id === newSeq.id);
                if (existingIndex >= 0) {
                    merged[existingIndex] = newSeq;
                } else {
                    merged.push(newSeq);
                }
            });
            
            this.saveAllSequences(merged);
            
            return {
                success: true,
                message: `${sequences.length} sequências importadas`,
                total: merged.length
            };
        } catch (error) {
            return {
                success: false,
                message: 'Erro ao importar: ' + error.message
            };
        }
    }
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    SequenceService.initialize();
});

// Exportar globalmente
window.SequenceService = SequenceService;