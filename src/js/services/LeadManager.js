/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

class LeadManager {
    constructor() {
        this.leads = this.loadLeads();
    }

    loadLeads() {
        const storedLeads = StorageManager.readStoredObject('leads', {});
        let hasChanges = false;

        const normalizedLeads = Object.entries(storedLeads).reduce((leadMap, [placeId, leadData]) => {
            const normalizedLead = this.normalizeLead(leadData);
            leadMap[placeId] = normalizedLead;

            if (JSON.stringify(normalizedLead) !== JSON.stringify(leadData || {})) {
                hasChanges = true;
            }

            return leadMap;
        }, {});

        if (hasChanges) {
            StorageManager.writeStoredObject('leads', normalizedLeads);
        }

        return normalizedLeads;
    }

    createLeadDefaults() {
        const now = new Date().toISOString();

        return {
            status: null,
            notes: [],
            tags: [],
            activities: [],
            nextActionAt: null,
            lastContactAt: null,
            ownerLabel: '',
            kanbanOrder: 0,
            createdAt: now,
            lastUpdated: now
        };
    }

    normalizeNote(note) {
        if (!note || typeof note !== 'object') {
            return null;
        }

        return {
            id: note.id || Date.now(),
            text: typeof note.text === 'string' ? note.text : '',
            date: note.date || new Date().toISOString()
        };
    }

    normalizeActivity(activity) {
        if (!activity || typeof activity !== 'object') {
            return null;
        }

        return {
            id: activity.id || `activity-${Date.now()}`,
            type: typeof activity.type === 'string' && activity.type.trim() ? activity.type.trim() : 'manual',
            description: typeof activity.description === 'string' ? activity.description : '',
            date: activity.date || new Date().toISOString(),
            metadata: activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata)
                ? activity.metadata
                : {}
        };
    }

    normalizeTags(tags) {
        if (!Array.isArray(tags)) {
            return [];
        }

        return [...new Set(
            tags
                .map(tag => String(tag || '').trim())
                .filter(Boolean)
        )];
    }

    normalizeStatus(status) {
        if (typeof status !== 'string') {
            return null;
        }

        const normalized = status.trim().toLowerCase();
        if (!normalized) {
            return null;
        }

        if (normalized.includes('quente')) return 'quente';
        if (normalized.includes('morno')) return 'morno';
        if (normalized.includes('frio')) return 'frio';

        return normalized;
    }

    normalizeLead(leadData = {}) {
        const defaults = this.createLeadDefaults();
        const normalizedNotes = Array.isArray(leadData.notes)
            ? leadData.notes.map(note => this.normalizeNote(note)).filter(Boolean)
            : [];
        const normalizedActivities = Array.isArray(leadData.activities)
            ? leadData.activities.map(activity => this.normalizeActivity(activity)).filter(Boolean)
            : [];

        return {
            ...defaults,
            ...leadData,
            status: this.normalizeStatus(leadData.status) || defaults.status,
            notes: normalizedNotes,
            tags: this.normalizeTags(leadData.tags),
            activities: normalizedActivities,
            nextActionAt: leadData.nextActionAt || null,
            lastContactAt: leadData.lastContactAt || null,
            ownerLabel: typeof leadData.ownerLabel === 'string' ? leadData.ownerLabel : '',
            kanbanOrder: Number.isFinite(Number(leadData.kanbanOrder)) ? Number(leadData.kanbanOrder) : 0,
            createdAt: leadData.createdAt || leadData.lastUpdated || defaults.createdAt,
            lastUpdated: leadData.lastUpdated || leadData.createdAt || defaults.lastUpdated
        };
    }

    ensureLead(placeId, leadData = {}) {
        const currentLead = this.leads[placeId] || {};
        this.leads[placeId] = this.normalizeLead({
            ...currentLead,
            ...leadData,
            createdAt: currentLead.createdAt || leadData.createdAt || new Date().toISOString()
        });

        return this.leads[placeId];
    }

    saveLead(placeId, leadData) {
        const currentLead = this.ensureLead(placeId, leadData);
        this.leads[placeId] = this.normalizeLead({
            ...currentLead,
            ...leadData,
            lastUpdated: new Date().toISOString()
        });
        this.saveToStorage();
        return this.leads[placeId];
    }

    updateLeadStatus(placeId, status) {
        this.ensureLead(placeId);
        this.leads[placeId].status = this.normalizeStatus(status);
        this.leads[placeId].lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return this.leads[placeId];
    }

    moveLeadToStatus(placeId, status, options = {}) {
        const lead = this.ensureLead(placeId);
        const normalizedStatus = this.normalizeStatus(status) || '';

        if (!normalizedStatus || lead.status === normalizedStatus) {
            return lead;
        }

        const now = new Date().toISOString();
        const previousStatus = lead.status || null;

        lead.status = normalizedStatus;
        lead.kanbanOrder = Number.isFinite(Number(options.kanbanOrder))
            ? Number(options.kanbanOrder)
            : Date.now();
        lead.lastUpdated = now;

        if (options.recordActivity !== false) {
            this.addActivity(placeId, {
                type: options.activityType || 'manual',
                description: options.description || `Pipeline movido para ${normalizedStatus}.`,
                date: now,
                metadata: {
                    status: normalizedStatus,
                    previousStatus,
                    source: options.source || 'kanban'
                }
            }, { save: false });
        }

        this.saveToStorage();
        return lead;
    }

    setLeadKanbanOrder(placeId, kanbanOrder, options = {}) {
        const lead = this.ensureLead(placeId);
        const normalizedOrder = Number(kanbanOrder);

        if (!Number.isFinite(normalizedOrder)) {
            return lead;
        }

        lead.kanbanOrder = normalizedOrder;
        lead.lastUpdated = new Date().toISOString();

        if (options.recordActivity === true) {
            this.addActivity(placeId, {
                type: options.activityType || 'manual',
                description: options.description || 'Ordem do pipeline ajustada.',
                date: lead.lastUpdated,
                metadata: {
                    kanbanOrder: normalizedOrder,
                    source: options.source || 'kanban-order'
                }
            }, { save: false });
        }

        this.saveToStorage();
        return lead;
    }

    addNote(placeId, note) {
        this.ensureLead(placeId);
        const noteObj = {
            id: Date.now(),
            text: note,
            date: new Date().toISOString()
        };
        this.leads[placeId].notes.unshift(noteObj);
        this.addActivity(placeId, {
            type: 'note',
            description: note,
            date: noteObj.date,
            metadata: {
                noteId: noteObj.id
            }
        }, { save: false });
        this.saveToStorage();
        return noteObj;
    }

    addActivity(placeId, activityData, options = {}) {
        this.ensureLead(placeId);

        const activity = this.normalizeActivity(activityData);
        if (!activity) {
            return null;
        }

        const existingIndex = this.leads[placeId].activities.findIndex(existingActivity => {
            if (activity.type === 'note' && activity.metadata?.noteId) {
                return existingActivity.type === 'note' && existingActivity.metadata?.noteId === activity.metadata.noteId;
            }

            if (activity.type === 'reminder' && activity.metadata?.nextActionAt) {
                return existingActivity.type === 'reminder'
                    && existingActivity.metadata?.nextActionAt === activity.metadata.nextActionAt;
            }

            return false;
        });

        if (existingIndex >= 0) {
            this.leads[placeId].activities.splice(existingIndex, 1);
        }

        this.leads[placeId].activities.unshift(activity);
        this.leads[placeId].lastUpdated = new Date().toISOString();

        if (options.save !== false) {
            this.saveToStorage();
        }

        return activity;
    }

    setTags(placeId, tags) {
        this.ensureLead(placeId);
        this.leads[placeId].tags = this.normalizeTags(tags);
        this.leads[placeId].lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return this.leads[placeId].tags;
    }

    addTag(placeId, tag) {
        const normalizedTag = String(tag || '').trim();
        if (!normalizedTag) {
            return [];
        }

        const lead = this.ensureLead(placeId);
        lead.tags = this.normalizeTags([...(lead.tags || []), normalizedTag]);
        lead.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return lead.tags;
    }

    removeTag(placeId, tag) {
        const normalizedTag = String(tag || '').trim();
        if (!normalizedTag) {
            return [];
        }

        const lead = this.ensureLead(placeId);
        lead.tags = (lead.tags || []).filter(existingTag => existingTag !== normalizedTag);
        lead.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return lead.tags;
    }

    setNextAction(placeId, nextActionAt) {
        const lead = this.ensureLead(placeId);
        lead.nextActionAt = nextActionAt || null;
        lead.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return lead;
    }

    setLastContactAt(placeId, lastContactAt = new Date().toISOString()) {
        const lead = this.ensureLead(placeId);
        lead.lastContactAt = lastContactAt;
        lead.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return lead;
    }

    updateOwnerLabel(placeId, ownerLabel) {
        const lead = this.ensureLead(placeId);
        lead.ownerLabel = typeof ownerLabel === 'string' ? ownerLabel.trim() : '';
        lead.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        return lead;
    }

    getLead(placeId) {
        return this.leads[placeId] || null;
    }

    getAllLeads() {
        return this.leads;
    }

    saveToStorage() {
        StorageManager.writeStoredObject('leads', this.leads);
    }

    deleteNote(placeId, noteId) {
        if (!this.leads[placeId] || !this.leads[placeId].notes) return false;
        const noteIndex = this.leads[placeId].notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) return false;
        
        this.leads[placeId].notes.splice(noteIndex, 1);
        this.saveToStorage();
        return true;
    }
}

// Exportar a instância única do LeadManager
window.leadManager = new LeadManager();
