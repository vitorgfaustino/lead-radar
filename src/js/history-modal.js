/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * history-modal.js
 * Controla o modal de Histórico de Consultas
 * Depende de: SearchHistoryService.js
 */

(function () {
    'use strict';

    // ─── Helpers ────────────────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob(['\ufeff' + content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function createEmptyState(message) {
        const wrapper = document.createElement('p');
        wrapper.className = 'text-gray-400 text-center py-8';
        wrapper.textContent = message;
        return wrapper;
    }

    function createHistorySessionCard(session) {
        const prospectedInSession = session.companies.filter(c =>
            window.prospectedPlaces && window.prospectedPlaces.has(c.placeId)
        ).length;
        const noWebsite = session.companies.filter(c =>
            !c.website || c.website === 'Não disponível'
        ).length;

        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-600 transition-colors';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-start gap-2 flex-wrap';

        const info = document.createElement('div');
        info.className = 'flex-1 min-w-0';

        const tagsRow = document.createElement('div');
        tagsRow.className = 'flex items-center gap-2 flex-wrap';

        const termTag = document.createElement('span');
        termTag.className = 'inline-flex items-center gap-1 bg-purple-900 text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium';
        const searchIcon = document.createElement('span');
        searchIcon.className = 'material-icons';
        searchIcon.style.fontSize = '12px';
        searchIcon.textContent = 'search';
        const termText = document.createElement('span');
        termText.textContent = session.searchTerm || 'Sem termo';
        termTag.append(searchIcon, termText);

        tagsRow.appendChild(termTag);

        if (session.location) {
            const locationTag = document.createElement('span');
            locationTag.className = 'inline-flex items-center gap-1 bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full';
            const placeIcon = document.createElement('span');
            placeIcon.className = 'material-icons';
            placeIcon.style.fontSize = '12px';
            placeIcon.textContent = 'place';
            const locationText = document.createElement('span');
            locationText.textContent = session.location;
            locationTag.append(placeIcon, locationText);
            tagsRow.appendChild(locationTag);
        }

        const date = document.createElement('p');
        date.className = 'text-xs text-gray-400 mt-1';
        date.textContent = formatDate(session.createdAt);

        info.append(tagsRow, date);

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-2';

        const loadButton = document.createElement('button');
        loadButton.className = 'history-load-session text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors';
        loadButton.dataset.sessionId = escapeHtml(session.id);
        loadButton.title = 'Carregar empresas desta consulta';

        const openIcon = document.createElement('span');
        openIcon.className = 'material-icons';
        openIcon.style.fontSize = '14px';
        openIcon.textContent = 'open_in_new';
        const loadText = document.createElement('span');
        loadText.textContent = 'Ver empresas';
        loadButton.append(openIcon, loadText);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'history-delete-session text-gray-500 hover:text-red-400 transition-colors';
        deleteButton.dataset.sessionId = escapeHtml(session.id);
        deleteButton.title = 'Remover esta consulta';

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-icons';
        deleteIcon.style.fontSize = '18px';
        deleteIcon.textContent = 'delete';
        deleteButton.appendChild(deleteIcon);

        actions.append(loadButton, deleteButton);
        header.append(info, actions);

        const stats = document.createElement('div');
        stats.className = 'flex gap-4 mt-3 text-xs text-gray-400';

        const companiesStat = document.createElement('span');
        companiesStat.className = 'flex items-center gap-1';
        const businessIcon = document.createElement('span');
        businessIcon.className = 'material-icons text-blue-400';
        businessIcon.style.fontSize = '14px';
        businessIcon.textContent = 'business';
        companiesStat.append(businessIcon, document.createTextNode(`${session.companies.length} empresa${session.companies.length !== 1 ? 's' : ''}`));

        const prospectedStat = document.createElement('span');
        prospectedStat.className = 'flex items-center gap-1';
        const checkIcon = document.createElement('span');
        checkIcon.className = 'material-icons text-green-400';
        checkIcon.style.fontSize = '14px';
        checkIcon.textContent = 'check_circle';
        prospectedStat.append(checkIcon, document.createTextNode(`${prospectedInSession} prospectada${prospectedInSession !== 1 ? 's' : ''}`));

        const websiteStat = document.createElement('span');
        websiteStat.className = 'flex items-center gap-1';
        const websiteIcon = document.createElement('span');
        websiteIcon.className = 'material-icons text-yellow-400';
        websiteIcon.style.fontSize = '14px';
        websiteIcon.textContent = 'language';
        websiteStat.append(websiteIcon, document.createTextNode(`${noWebsite} sem website`));

        stats.append(companiesStat, prospectedStat, websiteStat);
        card.append(header, stats);
        return card;
    }

    function createHistoryTermCard(group) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg p-4 border border-gray-700';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center flex-wrap gap-2';

        const titleWrapper = document.createElement('div');
        const title = document.createElement('h4');
        title.className = 'font-medium text-white flex items-center gap-2';
        const labelIcon = document.createElement('span');
        labelIcon.className = 'material-icons text-purple-400';
        labelIcon.style.fontSize = '18px';
        labelIcon.textContent = 'label';
        const titleText = document.createElement('span');
        titleText.textContent = group.term;
        title.append(labelIcon, titleText);
        titleWrapper.appendChild(title);

        if (group.locations.length > 0) {
            const locations = document.createElement('p');
            locations.className = 'text-xs text-gray-400 mt-1';
            locations.textContent = `Locais: ${group.locations.join(', ')}`;
            titleWrapper.appendChild(locations);
        }

        const stats = document.createElement('div');
        stats.className = 'flex gap-3 text-sm text-gray-300';

        const sessionCount = document.createElement('span');
        sessionCount.className = 'flex items-center gap-1';
        const searchIcon = document.createElement('span');
        searchIcon.className = 'material-icons text-purple-400';
        searchIcon.style.fontSize = '16px';
        searchIcon.textContent = 'search';
        sessionCount.append(searchIcon, document.createTextNode(`${group.sessionCount} consulta${group.sessionCount !== 1 ? 's' : ''}`));

        const companyCount = document.createElement('span');
        companyCount.className = 'flex items-center gap-1';
        const businessIcon = document.createElement('span');
        businessIcon.className = 'material-icons text-blue-400';
        businessIcon.style.fontSize = '16px';
        businessIcon.textContent = 'business';
        companyCount.append(businessIcon, document.createTextNode(`${group.totalCompanies} empresa${group.totalCompanies !== 1 ? 's' : ''}`));

        stats.append(sessionCount, companyCount);
        header.append(titleWrapper, stats);

        const buttons = document.createElement('div');
        buttons.className = 'mt-3 flex flex-wrap gap-1';

        group.sessions.forEach(session => {
            const button = document.createElement('button');
            button.className = 'history-load-session text-xs bg-gray-700 hover:bg-purple-800 text-gray-300 hover:text-white px-2 py-1 rounded transition-colors';
            button.dataset.sessionId = escapeHtml(session.id);
            button.textContent = `${formatDate(session.createdAt)} (${session.companies.length})`;
            buttons.appendChild(button);
        });

        card.append(header, buttons);
        return card;
    }

    function createHistoryCompanyCard(company) {
        const row = document.createElement('div');
        row.className = 'flex items-start gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors';

        const content = document.createElement('div');
        content.className = 'flex-1 min-w-0';

        const titleRow = document.createElement('div');
        titleRow.className = 'flex items-center gap-2 flex-wrap';

        const name = document.createElement('span');
        name.className = 'font-medium text-white text-sm truncate';
        name.textContent = company.nome;
        titleRow.appendChild(name);

        if (company.isProspected) {
            const prospected = document.createElement('span');
            prospected.className = 'text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded';
            prospected.textContent = 'Prospectado';
            titleRow.appendChild(prospected);
        }

        if (!company.website || company.website === 'Não disponível') {
            const websiteless = document.createElement('span');
            websiteless.className = 'text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded';
            websiteless.textContent = 'Sem website';
            titleRow.appendChild(websiteless);
        }

        const address = document.createElement('p');
        address.className = 'text-xs text-gray-400 mt-0.5 truncate';
        address.textContent = company.endereco || '—';

        const meta = document.createElement('div');
        meta.className = 'flex gap-3 mt-1 text-xs text-gray-500 flex-wrap';

        if (company.telefone && company.telefone !== 'Não disponível') {
            const phone = document.createElement('span');
            const phoneIcon = document.createElement('i');
            phoneIcon.className = 'fas fa-phone mr-1';
            phone.append(phoneIcon, document.createTextNode(company.telefone));
            meta.appendChild(phone);
        }

        if (company.avaliacao && company.avaliacao !== 'Não avaliado') {
            const rating = document.createElement('span');
            const ratingIcon = document.createElement('i');
            ratingIcon.className = 'fas fa-star mr-1 text-yellow-400';
            rating.append(ratingIcon, document.createTextNode(company.avaliacao));
            meta.appendChild(rating);
        }

        const sessionTerm = document.createElement('span');
        sessionTerm.className = 'text-purple-400';
        const tagIcon = document.createElement('i');
        tagIcon.className = 'fas fa-tag mr-1';
        sessionTerm.append(tagIcon, document.createTextNode(company.sessionTerm || '—'));

        const sessionDate = document.createElement('span');
        sessionDate.textContent = formatDate(company.sessionDate);

        meta.append(sessionTerm, sessionDate);
        content.append(titleRow, address, meta);

        row.appendChild(content);

        if (company.website && company.website !== 'Não disponível') {
            const link = document.createElement('a');
            link.href = escapeHtml(company.website);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'text-blue-400 hover:text-blue-300 flex-shrink-0';
            link.title = 'Abrir website';

            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.style.fontSize = '18px';
            icon.textContent = 'open_in_new';
            link.appendChild(icon);

            row.appendChild(link);
        }

        return row;
    }

    // ─── Estado local ────────────────────────────────────────────────────────────

    let currentTab = 'sessions';
    let companyFilters = { searchTerm: '', status: '', website: '', sessionId: '' };

    // ─── Renderização ────────────────────────────────────────────────────────────

    function renderStats() {
        const svc = window.SearchHistoryService;
        if (!svc) return;
        const stats = svc.getStats();
        const el = (id) => document.getElementById(id);
        if (el('statSessions'))   el('statSessions').textContent   = stats.totalSessions;
        if (el('statUnique'))     el('statUnique').textContent     = stats.uniqueCompanies;
        if (el('statProspected')) el('statProspected').textContent = stats.prospectedCount;
        if (el('statNoWebsite'))  el('statNoWebsite').textContent  = stats.noWebsiteCount;
    }

    function renderSessionsList() {
        const svc = window.SearchHistoryService;
        if (!svc) return;
        const sessions = svc.getAllSessions();
        const container = document.getElementById('historySessionsList');
        if (!container) return;

        if (sessions.length === 0) {
            container.replaceChildren(createEmptyState('Nenhuma consulta registrada ainda. Realize uma extração para começar.'));
            return;
        }

        container.replaceChildren(...sessions.map(createHistorySessionCard));

        // Eventos dos botões
        container.querySelectorAll('.history-load-session').forEach(btn => {
            btn.addEventListener('click', () => {
                const sessionId = btn.dataset.sessionId;
                loadSessionCompanies(sessionId);
            });
        });

        container.querySelectorAll('.history-delete-session').forEach(btn => {
            btn.addEventListener('click', () => {
                const sessionId = btn.dataset.sessionId;
                if (confirm('Remover esta consulta do histórico?')) {
                    window.SearchHistoryService.deleteSession(sessionId);
                    refreshModal();
                }
            });
        });
    }

    function renderByTermList() {
        const svc = window.SearchHistoryService;
        if (!svc) return;
        const groups = svc.getSessionsByTerm();
        const container = document.getElementById('historyByTermList');
        if (!container) return;

        if (groups.length === 0) {
            container.replaceChildren(createEmptyState('Nenhum dado disponível.'));
            return;
        }

        container.replaceChildren(...groups.map(createHistoryTermCard));

        container.querySelectorAll('.history-load-session').forEach(btn => {
            btn.addEventListener('click', () => loadSessionCompanies(btn.dataset.sessionId));
        });
    }

    function renderCompaniesList() {
        const svc = window.SearchHistoryService;
        if (!svc) return;

        const filters = {};
        if (companyFilters.searchTerm) filters.searchTerm = companyFilters.searchTerm;
        if (companyFilters.status === 'prospected') filters.onlyProspected = true;
        if (companyFilters.status === 'not_prospected') filters.onlyNotProspected = true;
        if (companyFilters.website === 'no_website') filters.noWebsite = true;
        if (companyFilters.sessionId) filters.sessionId = companyFilters.sessionId;

        const companies = svc.getAllCompanies(filters);
        const container = document.getElementById('historyCompaniesList');
        if (!container) return;

        if (companies.length === 0) {
            container.replaceChildren(createEmptyState('Nenhuma empresa encontrada com os filtros aplicados.'));
            return;
        }

        // Mostrar até 200 para não travar o browser
        const displayed = companies.slice(0, 200);
        const hasMore = companies.length > 200;

        const summary = document.createElement('p');
        summary.className = 'text-xs text-gray-400 mb-3';
        summary.textContent = `Exibindo ${displayed.length} de ${companies.length} empresa${companies.length !== 1 ? 's' : ''}${hasMore ? ' (limitado a 200 por performance)' : ''}`;

        container.replaceChildren(summary, ...displayed.map(createHistoryCompanyCard));
    }

    function populateSessionFilter() {
        const select = document.getElementById('historyFilterSession');
        if (!select || !window.SearchHistoryService) return;
        const sessions = window.SearchHistoryService.getAllSessions();
        const current = select.value;

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Todas as consultas';

        const options = sessions.map(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.selected = session.id === current;
            option.textContent = `${session.searchTerm || 'Sem termo'} — ${formatDate(session.createdAt)} (${session.companies.length})`;
            return option;
        });

        select.replaceChildren(defaultOption, ...options);
    }

    function refreshModal() {
        renderStats();
        if (currentTab === 'sessions') renderSessionsList();
        else if (currentTab === 'byterm') renderByTermList();
        else if (currentTab === 'companies') {
            populateSessionFilter();
            renderCompaniesList();
        }
    }

    // ─── Carregar empresas de uma sessão na tela principal ───────────────────────

    function loadSessionCompanies(sessionId) {
        const svc = window.SearchHistoryService;
        if (!svc) return;
        const session = svc.getSession(sessionId);
        if (!session) return;

        // Fechar modal
        document.getElementById('historyModal').classList.add('hidden');

        // Injetar resultados no allResults global e re-renderizar
        if (typeof window.allResults !== 'undefined' && typeof window.applyFilters === 'function') {
            window.allResults = session.companies.map(c => ({
                placeId: c.placeId,
                nome: c.nome,
                endereco: c.endereco,
                telefone: c.telefone || 'Não disponível',
                website: c.website || 'Não disponível',
                avaliacao: c.avaliacao || 'Não avaliado',
                totalAvaliacoes: c.totalAvaliacoes || 'N/A',
                categoria: c.categoria || '',
                hasPhoto: c.hasPhoto || false,
                localizacao: c.localizacao || null,
                horarios: c.horarios || null
            }));

            const countEl = document.getElementById('resultCount');
            if (countEl) countEl.textContent = `${window.allResults.length} resultado${window.allResults.length !== 1 ? 's' : ''}`;

            window.applyFilters();

            // Mostrar toast informativo
            showHistoryToast(`Carregadas ${session.companies.length} empresas de "${session.searchTerm || 'consulta anterior'}"`);
        }
    }

    function showHistoryToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-purple-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm';
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.style.fontSize = '18px';
        icon.textContent = 'history';
        const text = document.createElement('span');
        text.textContent = message;
        toast.append(icon, text);
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    // ─── Inicialização ───────────────────────────────────────────────────────────

    function init() {
        const modal = document.getElementById('historyModal');
        const openBtn = document.getElementById('openHistoryModalBtn');
        const closeBtn = document.getElementById('closeHistoryModalBtn');
        if (!modal || !openBtn) return;

        // Abrir modal
        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            refreshModal();
        });

        // Fechar modal
        closeBtn && closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

        // Tabs
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.history-tab').forEach(t => {
                    t.classList.remove('active', 'border-purple-500', 'text-purple-400');
                    t.classList.add('border-transparent', 'text-gray-400');
                });
                tab.classList.add('active', 'border-purple-500', 'text-purple-400');
                tab.classList.remove('border-transparent', 'text-gray-400');

                currentTab = tab.dataset.tab;

                document.querySelectorAll('.history-tab-content').forEach(c => c.classList.add('hidden'));
                const tabContent = document.getElementById(`historyTab${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`);
                if (tabContent) tabContent.classList.remove('hidden');

                // Mostrar/ocultar filtros de empresas
                const filtersBar = document.getElementById('historyCompanyFilters');
                if (filtersBar) {
                    if (currentTab === 'companies') filtersBar.classList.remove('hidden');
                    else filtersBar.classList.add('hidden');
                }

                refreshModal();
            });
        });

        // Filtros de empresas
        const searchInput = document.getElementById('historySearchInput');
        const filterStatus = document.getElementById('historyFilterStatus');
        const filterWebsite = document.getElementById('historyFilterWebsite');
        const filterSession = document.getElementById('historyFilterSession');

        let searchDebounce;
        searchInput && searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                companyFilters.searchTerm = searchInput.value.trim();
                renderCompaniesList();
            }, 300);
        });

        filterStatus && filterStatus.addEventListener('change', () => {
            companyFilters.status = filterStatus.value;
            renderCompaniesList();
        });

        filterWebsite && filterWebsite.addEventListener('change', () => {
            companyFilters.website = filterWebsite.value;
            renderCompaniesList();
        });

        filterSession && filterSession.addEventListener('change', () => {
            companyFilters.sessionId = filterSession.value;
            renderCompaniesList();
        });

        // Limpar histórico
        const clearBtn = document.getElementById('historyClearBtn');
        clearBtn && clearBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja apagar TODO o histórico de consultas? Esta ação não pode ser desfeita.')) {
                window.SearchHistoryService && window.SearchHistoryService.clearAll();
                refreshModal();
            }
        });

        // Exportar CSV
        const exportCSVBtn = document.getElementById('historyExportCSVBtn');
        exportCSVBtn && exportCSVBtn.addEventListener('click', () => {
            if (!window.SearchHistoryService) return;
            const filters = {};
            if (companyFilters.website === 'no_website') filters.noWebsite = true;
            if (companyFilters.status === 'prospected') filters.onlyProspected = true;
            if (companyFilters.status === 'not_prospected') filters.onlyNotProspected = true;
            if (companyFilters.sessionId) filters.sessionId = companyFilters.sessionId;

            const csv = window.SearchHistoryService.exportCSV(filters);
            const date = new Date().toISOString().slice(0, 10);
            downloadFile(csv, `historico_empresas_${date}.csv`, 'text/csv;charset=utf-8;');
        });

        // Exportar JSON
        const exportJSONBtn = document.getElementById('historyExportJSONBtn');
        exportJSONBtn && exportJSONBtn.addEventListener('click', () => {
            if (!window.SearchHistoryService) return;
            const json = window.SearchHistoryService.exportJSON();
            const date = new Date().toISOString().slice(0, 10);
            downloadFile(json, `historico_consultas_${date}.json`, 'application/json');
        });
    }

    // Aguardar DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
