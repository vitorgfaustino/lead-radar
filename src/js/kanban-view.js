/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

(function () {
    'use strict';

    const STATUS_COLUMNS = [
        {
            key: 'unclassified',
            label: 'Sem status',
            accentClass: 'border-slate-700 bg-slate-900/70',
            chipClass: 'bg-slate-800 text-slate-200',
            emptyMessage: 'Nenhuma empresa aguardando classificação inicial.'
        },
        {
            key: 'frio',
            label: 'Frio',
            accentClass: 'border-blue-500/25 bg-blue-500/10',
            chipClass: 'bg-blue-500/15 text-blue-100',
            emptyMessage: 'Nenhuma empresa em baixa prioridade neste recorte.'
        },
        {
            key: 'morno',
            label: 'Morno',
            accentClass: 'border-amber-500/25 bg-amber-500/10',
            chipClass: 'bg-amber-500/15 text-amber-100',
            emptyMessage: 'Nenhuma empresa em acompanhamento neste recorte.'
        },
        {
            key: 'quente',
            label: 'Quente',
            accentClass: 'border-red-500/25 bg-red-500/10',
            chipClass: 'bg-red-500/15 text-red-100',
            emptyMessage: 'Nenhuma empresa em prioridade alta neste recorte.'
        }
    ];

    const STATUS_LABELS = {
        quente: 'Quente',
        morno: 'Morno',
        frio: 'Frio'
    };

    const UNCLASSIFIED_INITIAL_LIMIT = 8;
    const boardState = {
        unclassifiedLimit: UNCLASSIFIED_INITIAL_LIMIT,
        activeLeadId: null
    };

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        }[character]));
    }

    function fmtDate(iso) {
        if (!iso) return '—';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const colors = {
            info: 'bg-purple-700',
            success: 'bg-green-700',
            error: 'bg-red-700'
        };

        const element = document.createElement('div');
        element.className = `pointer-events-auto ${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm`;
        element.innerHTML = `<span class="material-icons" style="font-size:18px">info</span>${esc(message)}`;
        container.appendChild(element);
        setTimeout(() => element.remove(), 3200);
    }

    function getLead(placeId) {
        return window.leadManager ? window.leadManager.getLead(placeId) : null;
    }

    function getCompany(placeId) {
        const service = window.SearchHistoryService;
        if (!service) return null;

        return service.getAllCompanies().find(company => company.placeId === placeId) || null;
    }

    function ensureLeadRecord(company) {
        if (!window.leadManager || !company) return null;

        const existingLead = getLead(company.placeId);
        if (existingLead) {
            return existingLead;
        }

        return window.leadManager.saveLead(company.placeId, {
            nome: company.nome || '',
            endereco: company.endereco || '',
            telefone: company.telefone || '',
            website: company.website || '',
            status: null,
            notes: [],
            tags: [],
            activities: [],
            nextActionAt: null,
            lastContactAt: null,
            ownerLabel: '',
            kanbanOrder: 0
        });
    }

    function getStatusKey(lead) {
        return lead && lead.status && STATUS_LABELS[lead.status] ? lead.status : 'unclassified';
    }

    function getLeadTags(lead) {
        if (!lead || !Array.isArray(lead.tags) || lead.tags.length === 0) {
            return '';
        }

        return `
            <div class="mt-2 flex flex-wrap gap-1.5">
                ${lead.tags.slice(0, 3).map(tag => `
                    <span class="rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-300">#${esc(tag)}</span>
                `).join('')}
            </div>
        `;
    }

    function getNextActionChip(lead) {
        if (!lead || !lead.nextActionAt) {
            return '';
        }

        const nextActionDate = new Date(lead.nextActionAt);
        if (Number.isNaN(nextActionDate.getTime())) {
            return '';
        }

        const overdue = nextActionDate.getTime() < Date.now();
        return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${overdue ? 'bg-red-500/15 text-red-100' : 'bg-cyan-500/15 text-cyan-100'}">
            <span class="material-icons" style="font-size:12px">event</span>
            ${overdue ? 'Atrasado' : 'Próxima ação'}: ${fmtDate(lead.nextActionAt)}
        </span>`;
    }

    function getScoreChip(placeId) {
        const scoreService = window.LeadScoreService;
        if (!scoreService) return '';

        const score = scoreService.getScore(placeId);
        if (!score) return '';

        const scoreLabels = {
            hot: 'Alto',
            warm: 'Médio',
            cold: 'Baixo'
        };
        const scoreClasses = {
            hot: 'score-hot',
            warm: 'score-warm',
            cold: 'score-cold'
        };

        return `<span class="badge ${scoreClasses[score.status] || 'badge-gray'}" title="Pontuação calculada automaticamente com base nos dados públicos da ficha: ${score.score} pontos.">${scoreLabels[score.status] || score.status} (${score.score}pts)</span>`;
    }

    function refreshLeadModal() {
        if (window.LeadModal && typeof window.LeadModal.refresh === 'function' && window.LeadModal.getActivePlaceId() === boardState.activeLeadId) {
            window.LeadModal.refresh();
            return;
        }

        if (!window.LeadModal || typeof window.LeadModal.open !== 'function') {
            boardState.activeLeadId = null;
        }
    }

    function closeLeadModal() {
        const activeLeadId = boardState.activeLeadId;
        boardState.activeLeadId = null;

        if (window.LeadModal && typeof window.LeadModal.close === 'function' && (!activeLeadId || window.LeadModal.getActivePlaceId() === activeLeadId)) {
            window.LeadModal.close();
        }
    }

    function openLeadModal(placeId) {
        const company = getCompany(placeId);
        if (!company) return;

        boardState.activeLeadId = placeId;

        if (!window.LeadModal || typeof window.LeadModal.open !== 'function') {
            boardState.activeLeadId = null;
            toast('Não foi possível abrir os detalhes agora.', 'error');
            return;
        }

        window.LeadModal.open(company, {
            source: 'kanban-modal',
            onChange: () => {
                renderBoard();
            },
            onClose: () => {
                boardState.activeLeadId = null;
            }
        });
    }

    function groupCompanies(companies) {
        return STATUS_COLUMNS.reduce((groups, column) => {
            groups[column.key] = [];
            return groups;
        }, { unclassified: [], frio: [], morno: [], quente: [] });
    }

    function sortColumnItems(items) {
        return items.sort((leftItem, rightItem) => {
            const leftOrder = Number(leftItem.lead?.kanbanOrder) || 0;
            const rightOrder = Number(rightItem.lead?.kanbanOrder) || 0;
            if (leftOrder !== rightOrder) {
                return rightOrder - leftOrder;
            }

            const leftUpdated = new Date(leftItem.lead?.lastUpdated || leftItem.company.sessionDate || 0).getTime();
            const rightUpdated = new Date(rightItem.lead?.lastUpdated || rightItem.company.sessionDate || 0).getTime();
            return rightUpdated - leftUpdated;
        });
    }

    function renderStats(totalCompanies, groupedCompanies) {
        const statsContainer = document.getElementById('kanbanStats');
        if (!statsContainer) return;

        const openActionCount = Object.values(groupedCompanies).flat().filter(item => item.lead?.nextActionAt && new Date(item.lead.nextActionAt).getTime() < Date.now()).length;
        const totalCards = totalCompanies;
        const totalProspected = Object.values(groupedCompanies).flat().filter(item => item.company.isProspected).length;

        statsContainer.innerHTML = `
            <div class="kanban-stat-card">
                <p class="text-xs text-gray-400">Empresas no painel</p>
                <p class="text-xl font-bold text-white">${totalCards}</p>
            </div>
            <div class="kanban-stat-card">
                <p class="text-xs text-gray-400">Prioridade alta</p>
                <p class="text-xl font-bold text-white">${groupedCompanies.quente.length}</p>
            </div>
            <div class="kanban-stat-card">
                <p class="text-xs text-gray-400">Precisam de retorno</p>
                <p class="text-xl font-bold text-white">${openActionCount}</p>
                <p class="mt-1 text-[11px] text-gray-500">Próxima ação vencida</p>
            </div>
            <div class="kanban-stat-card">
                <p class="text-xs text-gray-400">Já trabalhadas</p>
                <p class="text-xl font-bold text-white">${totalProspected}</p>
            </div>
        `;
    }

    function moveLead(placeId, status, options = {}) {
        if (!window.leadManager) return false;

        const lead = window.leadManager.ensureLead(placeId);
        if (!lead) return false;

        if (status === 'unclassified') {
            if (lead.status === null && options.kanbanOrder === undefined) {
                return false;
            }

            window.leadManager.updateLeadStatus(placeId, null);
            if (Number.isFinite(Number(options.kanbanOrder))) {
                window.leadManager.setLeadKanbanOrder(placeId, options.kanbanOrder, {
                    source: options.source || 'kanban-order-drop',
                    description: options.description || 'Ordem do pipeline ajustada.'
                });
            }

            return true;
        }

        if (lead.status === status && options.kanbanOrder === undefined) {
            return false;
        }

        if (lead.status === status) {
            window.leadManager.setLeadKanbanOrder(placeId, options.kanbanOrder, {
                source: options.source || 'kanban-order-drop',
                description: options.description || 'Ordem do pipeline ajustada.'
            });
            return true;
        }

        window.leadManager.moveLeadToStatus(placeId, status, {
            source: options.source || 'kanban-drag-drop',
            description: options.description || `Lead movido para ${STATUS_LABELS[status] || status}.`,
            kanbanOrder: options.kanbanOrder
        });
        return true;
    }

    function renderBoard() {
        const board = document.getElementById('kanbanBoard');
        const emptyState = document.getElementById('kanbanEmptyState');
        const statsMessage = document.getElementById('kanbanCount');
        const service = window.SearchHistoryService;

        if (!board || !service) return;

        const companies = service.getAllCompanies();
        if (statsMessage) {
            statsMessage.textContent = `${companies.length} empresa${companies.length !== 1 ? 's' : ''} no painel`;
        }

        if (companies.length === 0) {
            board.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            renderStats(0, { unclassified: [], frio: [], morno: [], quente: [] });
            return;
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        const grouped = groupCompanies(companies);
        companies.forEach(company => {
            const lead = getLead(company.placeId);
            grouped[getStatusKey(lead)].push({ company, lead });
        });

        STATUS_COLUMNS.forEach(column => sortColumnItems(grouped[column.key]));
        renderStats(companies.length, grouped);

        board.innerHTML = STATUS_COLUMNS.map(column => {
            const items = grouped[column.key] || [];
            const totalItems = items.length;
            const isUnclassified = column.key === 'unclassified';
            const visibleLimit = isUnclassified ? Math.min(boardState.unclassifiedLimit, totalItems) : totalItems;
            const visibleItems = items.slice(0, visibleLimit);
            const hasMoreItems = isUnclassified && totalItems > visibleLimit;

            return `
                <section class="kanban-column ${column.accentClass}" data-status-column="${column.key}">
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <h3 class="text-sm font-semibold text-white">${column.label}</h3>
                            <p class="text-xs text-gray-400">${totalItems} empresa${totalItems !== 1 ? 's' : ''}${hasMoreItems ? ` • mostrando ${visibleLimit}` : ''}</p>
                        </div>
                        <span class="rounded-full px-2 py-1 text-[11px] font-medium ${column.chipClass}">${totalItems}</span>
                    </div>
                    <div class="kanban-dropzone space-y-3" data-dropzone="${column.key}">
                        ${visibleItems.length ? visibleItems.map(({ company, lead }) => {
                            const hasPhone = company.telefone && company.telefone !== 'Não disponível';
                            const hasWebsite = company.website && company.website !== 'Não disponível';
                            const dragId = company.placeId;
                            return `
                                <article class="kanban-card" draggable="true" data-place-id="${esc(dragId)}" data-status="${esc(column.key)}">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="min-w-0">
                                            <p class="text-sm font-semibold text-white truncate">${esc(company.nome)}</p>
                                            <p class="text-xs text-gray-400 mt-1">${esc(company.endereco || 'Endereço não disponível')}</p>
                                        </div>
                                        <span class="kanban-card-handle material-icons text-gray-500" style="font-size:18px" aria-hidden="true">drag_indicator</span>
                                    </div>
                                    <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-400">
                                        ${hasPhone ? `<span class="text-cyan-300">${esc(company.telefone)}</span>` : '<span class="text-gray-500">Sem telefone</span>'}
                                        ${hasWebsite ? '<span class="text-green-300">Com website</span>' : '<span class="text-amber-300">Sem website</span>'}
                                    </div>
                                    <div class="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-400">
                                        <span>${fmtDate(company.sessionDate)}</span>
                                        ${getScoreChip(company.placeId)}
                                    </div>
                                    ${getNextActionChip(lead)}
                                    ${getLeadTags(lead)}
                                    <div class="mt-3 flex flex-wrap gap-1.5">
                                        <button type="button" class="kanban-details-btn rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/20 transition-colors" data-open-details="${esc(company.placeId)}" title="Abrir detalhes, notas, etiquetas e próximas ações deste lead.">Detalhes</button>
                                        ${['frio', 'morno', 'quente'].map(nextStatus => {
                                            const isCurrent = nextStatus === lead?.status;
                                            return `<button type="button" class="kanban-mini-move-btn rounded-full border px-2 py-1 text-[11px] transition-colors ${isCurrent ? 'border-accent bg-accent text-black cursor-default' : 'border-gray-600 text-gray-300 hover:border-accent hover:text-white'}" data-place-id="${esc(company.placeId)}" data-target-status="${esc(nextStatus)}" ${isCurrent ? 'disabled' : ''}>${STATUS_LABELS[nextStatus]}</button>`;
                                        }).join('')}
                                    </div>
                                </article>
                            `;
                        }).join('') : `<p class="text-sm text-gray-500">${column.emptyMessage}</p>`}
                        ${hasMoreItems ? `<div class="pt-1"><button type="button" class="kanban-load-more-btn" data-load-more-unclassified="true">Carregar mais ${Math.min(UNCLASSIFIED_INITIAL_LIMIT, totalItems - visibleLimit)} empresas</button></div>` : ''}
                    </div>
                </section>
            `;
        }).join('');

        const cards = board.querySelectorAll('.kanban-card');
        const dropzones = board.querySelectorAll('.kanban-dropzone');

        cards.forEach(card => {
            card.addEventListener('dragstart', event => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', card.dataset.placeId || '');
                card.classList.add('is-dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('is-dragging');
            });

            card.addEventListener('dragover', event => {
                event.preventDefault();
                card.classList.add('is-dragover');
            });

            card.addEventListener('dragleave', event => {
                if (!card.contains(event.relatedTarget)) {
                    card.classList.remove('is-dragover');
                }
            });

            card.addEventListener('drop', event => {
                event.preventDefault();
                card.classList.remove('is-dragover');

                const sourcePlaceId = event.dataTransfer.getData('text/plain');
                const targetPlaceId = card.dataset.placeId;
                if (!sourcePlaceId || !targetPlaceId || sourcePlaceId === targetPlaceId) {
                    return;
                }

                const sourceLead = getLead(sourcePlaceId);
                const targetLead = getLead(targetPlaceId);
                const targetStatus = card.dataset.status;
                const targetOrder = Number(targetLead?.kanbanOrder) || Date.now();
                const sourceStatus = sourceLead?.status || null;
                const moved = moveLead(sourcePlaceId, targetStatus, {
                    kanbanOrder: targetOrder + 1,
                    source: 'kanban-card-drop',
                    description: targetStatus === sourceStatus
                        ? 'Ordem do pipeline ajustada.'
                        : `Lead movido para ${STATUS_LABELS[targetStatus] || targetStatus}.`
                });

                if (moved) {
                    renderBoard();
                    toast(targetStatus === sourceStatus ? 'Ordem do card ajustada.' : `Lead movido para ${STATUS_LABELS[targetStatus] || targetStatus}.`, 'success');
                }
            });
        });

        board.querySelectorAll('.kanban-details-btn').forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                openLeadModal(button.dataset.openDetails || '');
            });
        });

        dropzones.forEach(dropzone => {
            const status = dropzone.dataset.dropzone;

            dropzone.addEventListener('dragover', event => {
                event.preventDefault();
                dropzone.classList.add('is-dragover');
            });

            dropzone.addEventListener('dragleave', event => {
                if (!dropzone.contains(event.relatedTarget)) {
                    dropzone.classList.remove('is-dragover');
                }
            });

            dropzone.addEventListener('drop', event => {
                event.preventDefault();
                dropzone.classList.remove('is-dragover');

                const placeId = event.dataTransfer.getData('text/plain');
                if (!placeId || !status) {
                    return;
                }

                const updated = moveLead(placeId, status, {
                    kanbanOrder: Date.now(),
                    source: 'kanban-dropzone-drop',
                    description: `Lead movido para ${STATUS_LABELS[status] || status}.`
                });
                if (updated) {
                    renderBoard();
                    toast(`Lead movido para ${STATUS_LABELS[status] || status}.`, 'success');
                }
            });
        });

        board.querySelectorAll('[data-load-more-unclassified]').forEach(button => {
            button.addEventListener('click', () => {
                boardState.unclassifiedLimit += UNCLASSIFIED_INITIAL_LIMIT;
                renderBoard();
            });
        });

        board.querySelectorAll('.kanban-mini-move-btn').forEach(button => {
            button.addEventListener('click', () => {
                const placeId = button.dataset.placeId;
                const targetStatus = button.dataset.targetStatus;
                const updated = moveLead(placeId, targetStatus, {
                    kanbanOrder: Date.now(),
                    source: 'kanban-mini-button',
                    description: `Lead movido para ${STATUS_LABELS[targetStatus] || targetStatus}.`
                });
                if (updated) {
                    renderBoard();
                    toast(`Lead movido para ${STATUS_LABELS[targetStatus] || targetStatus}.`, 'success');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderBoard();
        document.getElementById('refreshKanbanBtn')?.addEventListener('click', renderBoard);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeLeadModal();
            }
        });
        window.addEventListener('storage', event => {
            if (event.key === 'leads' || event.key === 'searchHistory') {
                renderBoard();
            }
        });
    });

    window.openKanbanLeadModal = openLeadModal;
    window.closeKanbanLeadModal = closeLeadModal;
})();
