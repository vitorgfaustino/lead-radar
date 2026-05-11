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

    const ACTIVITY_PAGE_SIZE = 5;

    const STATUS_META = {
        quente: { label: 'Quente', icon: 'local_fire_department', tone: 'hot' },
        morno: { label: 'Morno', icon: 'device_thermostat', tone: 'warm' },
        frio: { label: 'Frio', icon: 'ac_unit', tone: 'cold' },
        none: { label: 'Sem status', icon: 'remove_circle_outline', tone: 'neutral' }
    };

    const SCORE_META = {
        hot: { label: 'Score alto', tone: 'hot', icon: 'signal_cellular_alt' },
        warm: { label: 'Score médio', tone: 'warm', icon: 'equalizer' },
        cold: { label: 'Score baixo', tone: 'cold', icon: 'trending_flat' }
    };

    const DEFAULT_DISCLOSURE_STATE = {
        summary: true,
        activities: false,
        tags: false,
        notes: false
    };

    const state = {
        company: null,
        options: {},
        active: false,
        activityPage: 0,
        disclosureState: { ...DEFAULT_DISCLOSURE_STATE }
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

    function safeUrl(url) {
        const rawValue = String(url || '').trim();
        if (!rawValue) {
            return '';
        }

        if (/^https?:\/\//i.test(rawValue)) {
            return rawValue;
        }

        return `https://${rawValue.replace(/^\/+/, '')}`;
    }

    function buildGoogleFichaUrl(company) {
        if (!company) {
            return '';
        }

        const directUrl = safeUrl(company.googleMapsUri || company.googleMapsUrl || '');
        if (directUrl) {
            return directUrl;
        }

        const placeId = String(company.placeId || '').trim();
        if (!placeId) {
            return '';
        }

        const query = encodeURIComponent(company.nome || company.endereco || '');
        const queryPlaceId = encodeURIComponent(placeId);
        return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${queryPlaceId}`;
    }

    function fmtDate(isoValue) {
        if (!isoValue) return '—';
        const date = new Date(isoValue);
        if (Number.isNaN(date.getTime())) return '—';

        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function toDateTimeLocalValue(isoValue) {
        if (!isoValue) return '';

        const date = new Date(isoValue);
        if (Number.isNaN(date.getTime())) return '';

        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getScorePresentation(scoreStatus) {
        return SCORE_META[scoreStatus] || { label: 'Score', tone: 'neutral', icon: 'query_stats' };
    }

    function renderInlineHighlight(text, icon, tone) {
        return `<span class="lead-workspace-inline-highlight lead-workspace-inline-highlight--${esc(tone || 'neutral')}"><span class="material-icons" style="font-size:14px">${esc(icon)}</span>${esc(text)}</span>`;
    }

    function applyDisclosureState(elements) {
        const disclosureMap = [
            ['summaryDisclosure', 'summary'],
            ['activitiesDisclosure', 'activities'],
            ['tagsDisclosure', 'tags'],
            ['notesDisclosure', 'notes']
        ];

        disclosureMap.forEach(([elementKey, stateKey]) => {
            const disclosure = elements[elementKey];
            if (!disclosure) {
                return;
            }

            disclosure.open = Boolean(state.disclosureState[stateKey]);
            disclosure.ontoggle = () => {
                if (!state.active) {
                    return;
                }

                state.disclosureState[stateKey] = disclosure.open;
            };
        });
    }

    function captureDisclosureState(elements) {
        const disclosureMap = [
            ['summaryDisclosure', 'summary'],
            ['activitiesDisclosure', 'activities'],
            ['tagsDisclosure', 'tags'],
            ['notesDisclosure', 'notes']
        ];

        disclosureMap.forEach(([elementKey, stateKey]) => {
            const disclosure = elements[elementKey];
            if (!disclosure) {
                return;
            }

            state.disclosureState[stateKey] = disclosure.open;
        });
    }

    function getLeadManager() {
        if (!window.leadManager && typeof window.LeadManager === 'function') {
            window.leadManager = new window.LeadManager();
        }

        if (window.leadManager && typeof window.leadManager.loadLeads === 'function') {
            window.leadManager.leads = window.leadManager.loadLeads();
        }

        return window.leadManager || null;
    }

    function getStorageSet(key) {
        if (window.StorageManager && typeof window.StorageManager.readStoredSet === 'function') {
            return window.StorageManager.readStoredSet(key, []);
        }

        try {
            return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        } catch (error) {
            return new Set();
        }
    }

    function writeStorageSet(key, setValue) {
        if (window.StorageManager && typeof window.StorageManager.writeStoredSet === 'function') {
            window.StorageManager.writeStoredSet(key, setValue);
            return;
        }

        localStorage.setItem(key, JSON.stringify([...setValue]));
    }

    function getProspectedPlaces() {
        const current = window.prospectedPlaces;
        if (current instanceof Set) {
            return current;
        }

        const storedSet = getStorageSet('prospectedPlaces');
        window.prospectedPlaces = storedSet;
        return storedSet;
    }

    function getLeadScore(placeId) {
        if (!window.LeadScoreService || typeof window.LeadScoreService.getScore !== 'function') {
            return null;
        }

        return window.LeadScoreService.getScore(placeId);
    }

    function getAllKnownCompanies() {
        if (window.SearchHistoryService && typeof window.SearchHistoryService.getAllCompanies === 'function') {
            return window.SearchHistoryService.getAllCompanies();
        }

        return [];
    }

    function getCompanySnapshot(placeId) {
        if (!placeId) {
            return state.company;
        }

        const companyFromHistory = getAllKnownCompanies().find(company => company.placeId === placeId);
        if (companyFromHistory) {
            return { ...state.company, ...companyFromHistory };
        }

        return state.company;
    }

    function ensureLead(company) {
        const leadManager = getLeadManager();
        if (!leadManager || !company || !company.placeId) {
            return null;
        }

        return leadManager.ensureLead(company.placeId, {
            nome: company.nome || '',
            endereco: company.endereco || '',
            telefone: company.telefone || '',
            website: company.website || '',
            categoria: company.categoria || ''
        });
    }

    function emitLeadEvent(type, detail = {}) {
        document.dispatchEvent(new CustomEvent(type, {
            detail: {
                placeId: state.company?.placeId || null,
                ...detail
            }
        }));
    }

    function syncExternalViews(reason) {
        emitLeadEvent('leadDataChanged', { reason });
        if (typeof state.options.onChange === 'function') {
            state.options.onChange({ placeId: state.company?.placeId || null, reason });
        }
    }

    function buildModalRoot() {
        let root = document.getElementById('globalLeadModal');
        if (root) {
            return root;
        }

        root = document.createElement('div');
        root.id = 'globalLeadModal';
        root.className = 'modal fixed inset-0 z-[220] hidden items-start justify-center overflow-y-auto';
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = `
            <div class="lead-workspace-shell mx-auto w-full max-w-[88rem] px-4 py-4 sm:py-6">
                <div class="lead-workspace-panel modal-background flex w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:max-h-[calc(100vh-3rem)]">
                <div class="lead-workspace-header border-b border-white/10 px-6 py-5">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <span class="section-kicker">
                                <span class="material-icons" style="font-size:18px">business_center</span>
                                Workspace do lead
                            </span>
                            <h3 id="globalLeadModalTitle" class="mt-2 text-2xl font-semibold text-white"></h3>
                            <p id="globalLeadModalSubtitle" class="mt-2 text-sm text-slate-400"></p>
                        </div>
                        <button id="globalLeadModalCloseBtn" class="lead-workspace-icon-btn" type="button" aria-label="Fechar detalhes do lead">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div id="globalLeadModalChips" class="mt-4 flex flex-wrap gap-2"></div>
                </div>
                <div class="lead-workspace-body min-h-0 flex-1 overflow-y-scroll px-6 py-6">
                    <div class="lead-workspace-grid">
                        <section class="lead-workspace-column space-y-4">
                            <details id="globalLeadSummaryDisclosure" class="lead-workspace-disclosure lead-workspace-disclosure--open" open>
                                <summary class="lead-workspace-disclosure-summary">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Resumo</h4>
                                        <p class="lead-workspace-section-copy">Telefone, website, avaliação e score em um bloco mais direto.</p>
                                    </div>
                                    <span class="material-icons lead-workspace-disclosure-icon" aria-hidden="true">expand_more</span>
                                </summary>
                                <div class="lead-workspace-disclosure-body">
                                    <div id="globalLeadSummary"></div>
                                </div>
                            </details>
                            <div class="lead-workspace-section">
                                <div class="lead-workspace-section-title-row">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Etapa do lead</h4>
                                        <p id="globalLeadStatusSummary" class="lead-workspace-section-copy">Escolha a prioridade comercial deste lead.</p>
                                    </div>
                                </div>
                                <div id="globalLeadStatusButtons" class="lead-workspace-status-group"></div>
                            </div>
                            <div class="lead-workspace-section">
                                <div class="lead-workspace-section-title-row">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Acompanhamento</h4>
                                        <p class="lead-workspace-section-copy">Veja dono e marcos do lead antes de editar os campos.</p>
                                    </div>
                                </div>
                                <div class="lead-workspace-followup-strip">
                                    <div class="lead-workspace-followup-card">
                                        <span class="lead-workspace-followup-kicker">Responsável</span>
                                        <strong id="globalLeadOwnerSummary" class="lead-workspace-followup-value">Sem responsável</strong>
                                    </div>
                                    <div class="lead-workspace-followup-card">
                                        <span class="lead-workspace-followup-kicker">Próximo passo</span>
                                        <strong id="globalLeadNextActionSummary" class="lead-workspace-followup-value">Sem próximo passo</strong>
                                    </div>
                                    <div class="lead-workspace-followup-card">
                                        <span class="lead-workspace-followup-kicker">Último contato</span>
                                        <strong id="globalLeadLastContactSummary" class="lead-workspace-followup-value">Sem registro</strong>
                                    </div>
                                </div>
                                <div class="lead-workspace-form-grid lead-workspace-form-grid--followup">
                                    <label class="lead-workspace-field-block lead-workspace-field-block--span-2">
                                        <span class="lead-workspace-label">Responsável pelo contato</span>
                                        <input id="globalLeadOwnerInput" type="text" class="lead-workspace-field" placeholder="Quem vai conduzir este lead?">
                                    </label>
                                    <label class="lead-workspace-field-block">
                                        <span class="lead-workspace-label">Próximo passo</span>
                                        <input id="globalLeadNextActionInput" type="datetime-local" class="lead-workspace-field lead-workspace-field--datetime">
                                    </label>
                                    <label class="lead-workspace-field-block">
                                        <span class="lead-workspace-label">Último contato realizado</span>
                                        <input id="globalLeadLastContactInput" type="datetime-local" class="lead-workspace-field lead-workspace-field--datetime">
                                    </label>
                                </div>
                            </div>
                            <div class="lead-workspace-section">
                                <div class="lead-workspace-section-title-row">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Ações rápidas</h4>
                                        <p class="lead-workspace-section-copy">Atalhos operacionais para seguir com o contato sem sair do lead.</p>
                                    </div>
                                </div>
                                <div class="lead-workspace-quick-actions">
                                    <button id="globalLeadWhatsappBtn" class="lead-workspace-quick-btn" type="button">
                                        <span class="material-icons" style="font-size:18px">chat</span>
                                        WhatsApp
                                    </button>
                                    <button id="globalLeadCopyBtn" class="lead-workspace-quick-btn" type="button">
                                        <span class="material-icons" style="font-size:18px">content_copy</span>
                                        Copiar ficha
                                    </button>
                                    <button id="globalLeadEmailBtn" class="lead-workspace-quick-btn" type="button">
                                        <span class="material-icons" style="font-size:18px">mail</span>
                                        Email
                                    </button>
                                </div>
                            </div>
                        </section>
                        <section class="lead-workspace-column space-y-4">
                            <details id="globalLeadActivitiesDisclosure" class="lead-workspace-disclosure">
                                <summary class="lead-workspace-disclosure-summary lead-workspace-disclosure-summary--with-tools">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Atividades</h4>
                                        <p class="lead-workspace-section-copy">Histórico recente das ações registradas neste lead.</p>
                                    </div>
                                    <div class="lead-workspace-disclosure-tools">
                                        <span class="material-icons lead-workspace-disclosure-icon" aria-hidden="true">expand_more</span>
                                    </div>
                                </summary>
                                <div class="lead-workspace-disclosure-body">
                                    <div class="lead-workspace-disclosure-body-header">
                                        <div id="globalLeadActivitiesPager" class="lead-workspace-pager hidden"></div>
                                    </div>
                                    <div id="globalLeadActivitiesList" class="lead-workspace-list lead-workspace-list--stack lead-workspace-list--scroll"></div>
                                </div>
                            </details>
                            <details id="globalLeadTagsDisclosure" class="lead-workspace-disclosure">
                                <summary class="lead-workspace-disclosure-summary">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Etiquetas</h4>
                                        <p class="lead-workspace-section-copy">Agrupe por prioridade, origem, objeções ou qualquer recorte útil.</p>
                                    </div>
                                    <span class="material-icons lead-workspace-disclosure-icon" aria-hidden="true">expand_more</span>
                                </summary>
                                <div class="lead-workspace-disclosure-body">
                                    <div class="lead-workspace-inline-form">
                                        <input id="globalLeadTagInput" type="text" class="lead-workspace-field" placeholder="Ex.: urgente, retorno, sem site">
                                        <button id="globalLeadAddTagBtn" class="btn-primary rounded-xl px-4 py-3" type="button" aria-label="Adicionar etiqueta">
                                            <span class="material-icons" style="font-size:18px">add</span>
                                        </button>
                                    </div>
                                    <div id="globalLeadTagsList" class="lead-workspace-chip-list lead-workspace-disclosure-content-gap"></div>
                                </div>
                            </details>
                            <details id="globalLeadNotesDisclosure" class="lead-workspace-disclosure">
                                <summary class="lead-workspace-disclosure-summary">
                                    <div>
                                        <h4 class="lead-workspace-section-title">Notas</h4>
                                        <p class="lead-workspace-section-copy">Centralize contexto comercial, objeções e próximos passos importantes.</p>
                                    </div>
                                    <span class="material-icons lead-workspace-disclosure-icon" aria-hidden="true">expand_more</span>
                                </summary>
                                <div class="lead-workspace-disclosure-body">
                                    <div class="lead-workspace-inline-form lead-workspace-inline-form--textarea">
                                        <textarea id="globalLeadNoteInput" class="lead-workspace-field lead-workspace-textarea" rows="4" placeholder="Registre contexto, objeções ou próximos passos..."></textarea>
                                        <button id="globalLeadAddNoteBtn" class="btn-primary rounded-xl px-4 py-3" type="button" aria-label="Salvar nota">
                                            <span class="material-icons" style="font-size:18px">add</span>
                                        </button>
                                    </div>
                                    <div id="globalLeadNotesList" class="lead-workspace-list lead-workspace-list--stack lead-workspace-disclosure-content-gap"></div>
                                </div>
                            </details>
                        </section>
                    </div>
                </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);
        bindStaticEvents(root);
        return root;
    }

    function getElements() {
        const root = buildModalRoot();
        return {
            root,
            title: document.getElementById('globalLeadModalTitle'),
            subtitle: document.getElementById('globalLeadModalSubtitle'),
            chips: document.getElementById('globalLeadModalChips'),
            closeBtn: document.getElementById('globalLeadModalCloseBtn'),
            summaryDisclosure: document.getElementById('globalLeadSummaryDisclosure'),
            summary: document.getElementById('globalLeadSummary'),
            activitiesDisclosure: document.getElementById('globalLeadActivitiesDisclosure'),
            tagsDisclosure: document.getElementById('globalLeadTagsDisclosure'),
            statusSummary: document.getElementById('globalLeadStatusSummary'),
            statusButtons: document.getElementById('globalLeadStatusButtons'),
            ownerSummary: document.getElementById('globalLeadOwnerSummary'),
            nextActionSummary: document.getElementById('globalLeadNextActionSummary'),
            lastContactSummary: document.getElementById('globalLeadLastContactSummary'),
            ownerInput: document.getElementById('globalLeadOwnerInput'),
            nextActionInput: document.getElementById('globalLeadNextActionInput'),
            lastContactInput: document.getElementById('globalLeadLastContactInput'),
            tagInput: document.getElementById('globalLeadTagInput'),
            addTagBtn: document.getElementById('globalLeadAddTagBtn'),
            tagsList: document.getElementById('globalLeadTagsList'),
            notesDisclosure: document.getElementById('globalLeadNotesDisclosure'),
            noteInput: document.getElementById('globalLeadNoteInput'),
            addNoteBtn: document.getElementById('globalLeadAddNoteBtn'),
            notesList: document.getElementById('globalLeadNotesList'),
            activitiesList: document.getElementById('globalLeadActivitiesList'),
            activitiesPager: document.getElementById('globalLeadActivitiesPager'),
            whatsappBtn: document.getElementById('globalLeadWhatsappBtn'),
            copyBtn: document.getElementById('globalLeadCopyBtn'),
            emailBtn: document.getElementById('globalLeadEmailBtn')
        };
    }

    function bindStaticEvents(root) {
        root.addEventListener('click', event => {
            if (event.target === root) {
                close();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && state.active) {
                close();
            }
        });
    }

    function createInfoCard(title, rows) {
        return `
            <div class="lead-workspace-section lead-workspace-section--card">
                <p class="lead-workspace-card-kicker">${esc(title)}</p>
                <div class="mt-3 space-y-3 text-sm text-slate-200">
                    ${rows.map(({ label, value, icon, tone }) => `
                        <div class="lead-workspace-row">
                            <span class="lead-workspace-row-label">${icon ? `<span class="material-icons lead-workspace-row-icon lead-workspace-row-icon--${esc(tone || 'neutral')}" style="font-size:15px">${esc(icon)}</span>` : ''}<span>${esc(label)}</span></span>
                            <div class="lead-workspace-row-value">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderHeader(company, lead, elements) {
        const placeId = company.placeId || '';
        const prospectedSet = getProspectedPlaces();
        const isProspected = prospectedSet.has(placeId);
        const score = getLeadScore(placeId);
        const googleFichaUrl = buildGoogleFichaUrl(company);

        elements.title.textContent = company.nome || 'Lead';
        elements.subtitle.textContent = [company.endereco || 'Endereço não disponível', fmtDate(company.sessionDate)].filter(Boolean).join(' • ');

        const chips = [];
        chips.push(`<button id="globalLeadProspectBtn" type="button" class="prospected-badge ${isProspected ? 'prospected' : ''}"><span class="material-icons" style="font-size:16px">check_circle</span><span>${isProspected ? 'Prospectado' : 'Marcar como prospectado'}</span></button>`);

        if (lead.status && STATUS_META[lead.status]) {
            chips.push(`<span class="lead-workspace-chip lead-workspace-chip--${STATUS_META[lead.status].tone}"><span class="material-icons" style="font-size:14px">${STATUS_META[lead.status].icon}</span>${STATUS_META[lead.status].label}</span>`);
        }

        if (score) {
            const scoreMeta = getScorePresentation(score.status);
            chips.push(`<span class="lead-workspace-chip lead-workspace-chip--${scoreMeta.tone}"><span class="material-icons" style="font-size:14px">${scoreMeta.icon}</span>${scoreMeta.label}: ${esc(score.score)} pts</span>`);
        }

        if (lead.nextActionAt) {
            const tone = new Date(lead.nextActionAt).getTime() < Date.now() ? 'hot' : 'info';
            chips.push(`<span class="lead-workspace-chip lead-workspace-chip--${tone}"><span class="material-icons" style="font-size:14px">event</span>${new Date(lead.nextActionAt).getTime() < Date.now() ? 'Retorno atrasado' : 'Próximo passo'}: ${esc(fmtDate(lead.nextActionAt))}</span>`);
        }

        if (googleFichaUrl) {
            chips.push(`<a class="lead-workspace-chip lead-workspace-chip--info" href="${esc(googleFichaUrl)}" target="_blank" rel="noopener noreferrer"><span class="material-icons" style="font-size:14px">open_in_new</span>Abrir ficha no Google</a>`);
        }

        elements.chips.innerHTML = chips.join('');

        const prospectButton = document.getElementById('globalLeadProspectBtn');
        if (prospectButton) {
            prospectButton.onclick = () => {
                const setValue = getProspectedPlaces();
                const nextState = !setValue.has(placeId);
                if (nextState) {
                    setValue.add(placeId);
                    ensureLead(company);
                } else {
                    setValue.delete(placeId);
                }

                writeStorageSet('prospectedPlaces', setValue);
                window.prospectedPlaces = setValue;
                emitLeadEvent('prospectedStatusChanged', { isProspected: nextState });
                syncExternalViews('prospected');
                refresh();
            };
        }
    }

    function renderSummary(company, lead, elements) {
        const website = safeUrl(company.website);
        const googleFichaUrl = buildGoogleFichaUrl(company);
        const score = getLeadScore(company.placeId || '');
        const scoreMeta = score ? getScorePresentation(score.status) : null;
        const summaryHtml = createInfoCard('Resumo', [
            { label: 'Telefone', value: esc(company.telefone || 'Não disponível'), icon: 'call', tone: 'info' },
            { label: 'Categoria', value: esc(company.categoria || 'Não informada'), icon: 'sell', tone: 'violet' },
            { label: 'Website', value: website ? `<a class="text-cyan-300 hover:underline break-all" href="${esc(website)}" target="_blank" rel="noopener noreferrer">${esc(company.website)}</a>` : 'Não disponível', icon: 'language', tone: website ? 'success' : 'neutral' },
            { label: 'Avaliação', value: renderInlineHighlight(`${company.avaliacao || 'Sem nota'} · ${company.totalAvaliacoes || 0} avaliações`, 'star', 'warm'), icon: 'star_rate', tone: 'warm' },
            { label: 'Score da ficha', value: score ? renderInlineHighlight(`${scoreMeta.label} · ${score.score} pts`, scoreMeta.icon, scoreMeta.tone) : 'Score ainda não calculado', icon: 'query_stats', tone: scoreMeta ? scoreMeta.tone : 'neutral' }
        ]);

        elements.summary.innerHTML = summaryHtml;
    }

    function renderStatusSection(lead, elements) {
        elements.statusButtons.innerHTML = ['quente', 'morno', 'frio', 'none'].map(statusKey => {
            const meta = STATUS_META[statusKey];
            const normalizedStatus = statusKey === 'none' ? '' : statusKey;
            const isActive = (lead.status || '') === normalizedStatus;
            return `
                <button class="lead-status-btn rounded-full px-3 py-2 text-sm ${isActive ? 'active' : ''}" data-global-status="${normalizedStatus}" data-status-tone="${meta.tone}" type="button" aria-pressed="${isActive}">
                    <span class="material-icons lead-status-btn__icon mr-1" style="font-size:16px">${meta.icon}</span>
                    ${meta.label}
                </button>
            `;
        }).join('');

        elements.statusSummary.textContent = lead.status && STATUS_META[lead.status]
            ? `Etapa atual: ${STATUS_META[lead.status].label}.`
            : 'Escolha a prioridade comercial deste lead.';

        elements.statusButtons.querySelectorAll('[data-global-status]').forEach(button => {
            button.onclick = () => updateStatus(button.dataset.globalStatus || '');
        });
    }

    function renderFollowupSummary(lead, elements) {
        if (elements.ownerSummary) {
            elements.ownerSummary.textContent = lead.ownerLabel || 'Sem responsável';
        }

        if (elements.nextActionSummary) {
            elements.nextActionSummary.textContent = lead.nextActionAt ? fmtDate(lead.nextActionAt) : 'Sem próximo passo';
        }

        if (elements.lastContactSummary) {
            elements.lastContactSummary.textContent = lead.lastContactAt ? fmtDate(lead.lastContactAt) : 'Sem registro';
        }
    }

    function renderInputs(lead, elements) {
        renderFollowupSummary(lead, elements);
        elements.ownerInput.value = lead.ownerLabel || '';
        elements.nextActionInput.value = toDateTimeLocalValue(lead.nextActionAt);
        elements.lastContactInput.value = toDateTimeLocalValue(lead.lastContactAt);
        elements.tagInput.value = '';
        elements.noteInput.value = '';

        elements.ownerInput.onchange = () => {
            const leadManager = getLeadManager();
            if (!leadManager || !state.company) return;
            leadManager.updateOwnerLabel(state.company.placeId, elements.ownerInput.value);
            syncExternalViews('owner');
            refresh();
        };

        elements.nextActionInput.onchange = () => {
            const leadManager = getLeadManager();
            if (!leadManager || !state.company) return;

            const value = elements.nextActionInput.value ? new Date(elements.nextActionInput.value).toISOString() : null;
            leadManager.setNextAction(state.company.placeId, value);
            if (value) {
                leadManager.addActivity(state.company.placeId, {
                    type: 'reminder',
                    description: `Próximo passo agendado para ${new Date(value).toLocaleString('pt-BR')}`,
                    date: new Date().toISOString(),
                    metadata: { nextActionAt: value, source: state.options.source || 'lead-modal' }
                });
            }
            syncExternalViews('next-action');
            refresh();
        };

        elements.lastContactInput.onchange = () => {
            const leadManager = getLeadManager();
            if (!leadManager || !state.company) return;

            const value = elements.lastContactInput.value ? new Date(elements.lastContactInput.value).toISOString() : null;
            leadManager.setLastContactAt(state.company.placeId, value);
            leadManager.addActivity(state.company.placeId, {
                type: 'manual',
                description: value ? `Último contato atualizado para ${new Date(value).toLocaleString('pt-BR')}` : 'Último contato removido.',
                date: new Date().toISOString(),
                metadata: { lastContactAt: value, source: state.options.source || 'lead-modal' }
            });
            syncExternalViews('last-contact');
            refresh();
        };

        elements.addTagBtn.onclick = () => {
            const leadManager = getLeadManager();
            if (!leadManager || !state.company) return;
            const tagValue = elements.tagInput.value.trim();
            if (!tagValue) return;
            leadManager.addTag(state.company.placeId, tagValue);
            syncExternalViews('tag');
            refresh();
        };

        elements.tagInput.onkeydown = event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.addTagBtn.click();
            }
        };

        elements.addNoteBtn.onclick = () => {
            const leadManager = getLeadManager();
            if (!leadManager || !state.company) return;
            const noteText = elements.noteInput.value.trim();
            if (!noteText) return;
            leadManager.addNote(state.company.placeId, noteText);
            syncExternalViews('note');
            refresh();
        };

        elements.noteInput.onkeydown = event => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                elements.addNoteBtn.click();
            }
        };
    }

    function renderTags(lead, elements) {
        const tags = Array.isArray(lead.tags) ? lead.tags : [];
        if (!tags.length) {
            elements.tagsList.innerHTML = '<p class="lead-workspace-empty">Nenhuma tag ainda.</p>';
            return;
        }

        elements.tagsList.innerHTML = tags.map(tag => `
            <button type="button" class="lead-workspace-removable-chip" data-remove-tag="${esc(tag)}">
                <span>#${esc(tag)}</span>
                <span class="material-icons" style="font-size:14px">close</span>
            </button>
        `).join('');

        elements.tagsList.querySelectorAll('[data-remove-tag]').forEach(button => {
            button.onclick = () => {
                const leadManager = getLeadManager();
                if (!leadManager || !state.company) return;
                leadManager.removeTag(state.company.placeId, button.dataset.removeTag || '');
                syncExternalViews('tag-remove');
                refresh();
            };
        });
    }

    function renderNotes(lead, elements) {
        const notes = Array.isArray(lead.notes) ? lead.notes : [];
        if (!notes.length) {
            elements.notesList.innerHTML = '<p class="lead-workspace-empty">Nenhuma nota ainda.</p>';
            return;
        }

        elements.notesList.innerHTML = notes.map(note => `
            <article class="lead-workspace-item">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-sm text-slate-100 whitespace-pre-wrap">${esc(note.text || '')}</p>
                        <p class="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">${esc(fmtDate(note.date))}</p>
                    </div>
                    <button type="button" class="lead-workspace-icon-btn lead-workspace-icon-btn--small" data-delete-note="${esc(note.id)}" aria-label="Excluir nota">
                        <span class="material-icons" style="font-size:16px">delete</span>
                    </button>
                </div>
            </article>
        `).join('');

        elements.notesList.querySelectorAll('[data-delete-note]').forEach(button => {
            button.onclick = () => {
                const leadManager = getLeadManager();
                if (!leadManager || !state.company) return;
                const noteId = Number(button.dataset.deleteNote);
                if (!Number.isFinite(noteId)) return;
                if (!leadManager.deleteNote(state.company.placeId, noteId)) return;
                syncExternalViews('note-delete');
                refresh();
            };
        });
    }

    function formatActivityLabel(activity) {
        const labels = {
            note: 'Nota adicionada',
            reminder: 'Próximo passo agendado',
            status: 'Status alterado',
            manual: 'Atualização manual',
            tag: 'Tag atualizada'
        };

        return labels[activity?.type] || 'Atualização do lead';
    }

    function renderActivities(lead, elements) {
        const activities = Array.isArray(lead.activities) ? lead.activities : [];
        const totalPages = Math.max(1, Math.ceil(activities.length / ACTIVITY_PAGE_SIZE));
        state.activityPage = clamp(state.activityPage, 0, totalPages - 1);

        if (!activities.length) {
            elements.activitiesList.innerHTML = '<p class="lead-workspace-empty">Nenhuma atividade registrada ainda.</p>';
            if (elements.activitiesPager) {
                elements.activitiesPager.innerHTML = '';
                elements.activitiesPager.classList.add('hidden');
            }
            return;
        }

        const start = state.activityPage * ACTIVITY_PAGE_SIZE;
        const visibleActivities = activities.slice(start, start + ACTIVITY_PAGE_SIZE);

        elements.activitiesList.innerHTML = visibleActivities.map(activity => `
            <article class="lead-workspace-item">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-sm font-medium text-white">${esc(formatActivityLabel(activity))}</p>
                        <p class="mt-1 text-sm text-slate-300">${esc(activity.description || 'Sem descrição.')}</p>
                    </div>
                    <span class="text-[11px] text-slate-500 whitespace-nowrap">${esc(fmtDate(activity.date))}</span>
                </div>
            </article>
        `).join('');

        if (!elements.activitiesPager) {
            return;
        }

        if (activities.length <= ACTIVITY_PAGE_SIZE) {
            elements.activitiesPager.innerHTML = `<span class="lead-workspace-pager-summary">${activities.length} registro${activities.length === 1 ? '' : 's'}</span>`;
            elements.activitiesPager.classList.remove('hidden');
            return;
        }

        const lastItemIndex = Math.min(start + ACTIVITY_PAGE_SIZE, activities.length);
        elements.activitiesPager.innerHTML = `
            <span class="lead-workspace-pager-summary">${start + 1}-${lastItemIndex} de ${activities.length}</span>
            <button type="button" class="lead-workspace-pager-btn" data-activities-page="prev" ${state.activityPage === 0 ? 'disabled' : ''} aria-label="Mostrar atividades mais recentes anteriores">
                <span class="material-icons" style="font-size:16px">chevron_left</span>
            </button>
            <button type="button" class="lead-workspace-pager-btn" data-activities-page="next" ${state.activityPage >= totalPages - 1 ? 'disabled' : ''} aria-label="Mostrar atividades mais antigas">
                <span class="material-icons" style="font-size:16px">chevron_right</span>
            </button>
        `;
        elements.activitiesPager.classList.remove('hidden');
        elements.activitiesPager.querySelectorAll('[data-activities-page]').forEach(button => {
            button.onclick = () => {
                const direction = button.dataset.activitiesPage === 'next' ? 1 : -1;
                state.activityPage = clamp(state.activityPage + direction, 0, totalPages - 1);
                render();
            };
        });
    }

    function renderQuickActions(company, elements) {
        elements.whatsappBtn.onclick = () => {
            const phone = String(company.telefone || '').replace(/\D/g, '');
            if (!phone) return;
            const message = encodeURIComponent(`Olá! Vi seu negócio ${company.nome || ''} e gostaria de apresentar nossa solução.`);
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener');
        };

        elements.copyBtn.onclick = async () => {
            const content = [
                company.nome || '',
                company.endereco || '',
                company.telefone || '',
                company.website || ''
            ].filter(Boolean).join('\n');

            if (!content) return;

            try {
                await navigator.clipboard.writeText(content);
            } catch (error) {
                const helper = document.createElement('textarea');
                helper.value = content;
                document.body.appendChild(helper);
                helper.select();
                document.execCommand('copy');
                document.body.removeChild(helper);
            }
        };

        elements.emailBtn.onclick = () => {
            const subject = encodeURIComponent(`Contato sobre ${company.nome || 'seu negócio'}`);
            const body = encodeURIComponent(`Olá,\n\nGostaria de falar sobre ${company.nome || 'seu negócio'}.`);
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener');
        };
    }

    function updateStatus(nextStatus) {
        const leadManager = getLeadManager();
        if (!leadManager || !state.company) return;

        if (!nextStatus) {
            leadManager.updateLeadStatus(state.company.placeId, null);
            leadManager.addActivity(state.company.placeId, {
                type: 'status',
                description: 'Status removido.',
                date: new Date().toISOString(),
                metadata: { status: null, source: state.options.source || 'lead-modal' }
            });
        } else {
            leadManager.moveLeadToStatus(state.company.placeId, nextStatus, {
                source: state.options.source || 'lead-modal',
                description: `Status ajustado para ${STATUS_META[nextStatus]?.label || nextStatus}.`,
                activityType: 'status'
            });
        }

        syncExternalViews('status');
        refresh();
    }

    function render() {
        const elements = getElements();
        const company = getCompanySnapshot(state.company?.placeId) || state.company;
        if (!company || !company.placeId) {
            return;
        }

        state.company = company;
        applyDisclosureState(elements);
        const lead = ensureLead(company) || {};

        renderHeader(company, lead, elements);
        renderSummary(company, lead, elements);
        renderStatusSection(lead, elements);
        renderInputs(lead, elements);
        renderTags(lead, elements);
        renderNotes(lead, elements);
        renderActivities(lead, elements);
        renderQuickActions(company, elements);

        elements.closeBtn.onclick = close;
    }

    function open(company, options = {}) {
        if (!company || !company.placeId) {
            return false;
        }

        state.company = { ...company };
        state.options = options;
        state.active = true;
        state.activityPage = 0;

        const elements = getElements();
        if (!state.disclosureState || typeof state.disclosureState !== 'object') {
            state.disclosureState = { ...DEFAULT_DISCLOSURE_STATE };
        }
        elements.root.classList.remove('hidden');
        elements.root.classList.add('flex');
        elements.root.setAttribute('aria-hidden', 'false');
        render();
        return true;
    }

    function close() {
        const root = document.getElementById('globalLeadModal');
        if (!root) return;

        captureDisclosureState(getElements());

        root.classList.add('hidden');
        root.classList.remove('flex');
        root.setAttribute('aria-hidden', 'true');
        state.active = false;

        if (typeof state.options.onClose === 'function') {
            state.options.onClose({ placeId: state.company?.placeId || null });
        }
    }

    function refresh() {
        if (!state.active || !state.company?.placeId) {
            return;
        }

        render();
    }

    function isOpen() {
        return state.active;
    }

    function getActivePlaceId() {
        return state.company?.placeId || null;
    }

    window.LeadModal = {
        open,
        close,
        refresh,
        isOpen,
        getActivePlaceId
    };
})();