/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

// Remover declarações globais
let placesService;
let mapService;
let geocoder;
let allResults = [];
const PROJECT_VERSION = window.PROJECT_VERSION || '1.0.0';
const LOCATION_AUTOCOMPLETE_DEBOUNCE_MS = 180;
const RESULTS_PER_PAGE = 21;
const legacyAppState = window.appState || { activeFilters: {} };
window.paginationState = window.paginationState || {
    listPage: 1,
    gridPage: 1
};
const locationAutocompleteState = {
    initialized: false,
    placesLibrary: null,
    request: null,
    newestRequestId: 0,
    debounceTimer: null,
    blurTimer: null,
    suggestions: [],
    activeIndex: -1
};

// Inicializar prospectedPlaces no escopo global
if (!window.prospectedPlaces) {
    window.prospectedPlaces = StorageManager.readStoredSet('prospectedPlaces', []);
}

let currentView = StorageManager.readStoredValue('preferredView', 'list');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeUrl(value) {
    try {
        const url = new URL(String(value ?? ''), window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch {
        return '#';
    }
}

function setButtonIconText(button, iconClass, text, textClass = '') {
    if (!button) return;

    button.replaceChildren();

    const icon = document.createElement('i');
    icon.className = iconClass;
    button.appendChild(icon);

    if (text) {
        const label = document.createElement('span');
        if (textClass) {
            label.className = textClass;
        }
        label.textContent = text;
        button.appendChild(label);
    }
}

function createWebsiteNode(website) {
    if (website === 'Não disponível') {
        const unavailable = document.createElement('span');
        unavailable.className = 'text-gray-400';
        unavailable.textContent = 'Website não disponível';
        return unavailable;
    }

    const link = document.createElement('a');
    link.href = safeUrl(website);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'text-accent hover:underline flex items-center';
    link.textContent = 'Visitar Website';

    const icon = document.createElement('i');
    icon.className = 'fas fa-external-link-alt ml-1 text-xs';
    link.appendChild(icon);
    return link;
}

function createRatingNode(average, totalReviews, showReviewsText = false) {
    if (average === 'Não avaliado') {
        const unavailable = document.createElement('span');
        unavailable.className = 'text-gray-400';
        unavailable.textContent = 'Não avaliado';
        return unavailable;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center';

    const value = document.createElement('span');
    value.className = 'text-yellow-300 font-medium mr-1';
    value.textContent = escapeHtml(average);

    const icon = document.createElement('i');
    icon.className = 'fas fa-star text-yellow-300 text-sm';

    const count = document.createElement('span');
    count.className = showReviewsText ? 'text-gray-400 text-xs ml-1' : 'text-gray-400 text-xs ml-2';
    count.textContent = showReviewsText
        ? `(${escapeHtml(totalReviews)} avaliações)`
        : `(${escapeHtml(totalReviews)})`;

    wrapper.append(value, icon, count);
    return wrapper;
}

function createProspectedBadge(result) {
    const badge = document.createElement('div');
    badge.className = `prospected-badge ${prospectedPlaces.has(result.placeId) ? 'prospected' : ''}`;
    badge.dataset.placeId = escapeHtml(result.placeId);

    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';

    const text = document.createElement('span');
    text.textContent = prospectedPlaces.has(result.placeId) ? 'Prospectado' : 'Não Prospectado';

    badge.append(icon, text);
    return badge;
}

function getLeadBadges(placeId) {
    let badges = '';

    if (window.leadManager) {
        const lead = window.leadManager.getLead(placeId);
        if (lead && lead.status) {
            const labels = { quente: 'Quente', morno: 'Morno', frio: 'Frio' };
            const colors = { quente: 'bg-red-600', morno: 'bg-yellow-600', frio: 'bg-blue-600' };
            const leadStatus = lead.status;
            badges += `<span class="${colors[leadStatus] || 'bg-gray-600'} text-white text-xs px-2 py-0.5 rounded-full mr-1">${labels[leadStatus] || leadStatus}</span>`;
        }
    }

    if (window.LeadScoreService) {
        const score = window.LeadScoreService.getScore(placeId);
        if (score) {
            const colors = { hot: 'bg-red-600', warm: 'bg-yellow-600', cold: 'bg-blue-600' };
            badges += `<span class="${colors[score.status] || 'bg-gray-600'} text-white text-xs px-2 py-0.5 rounded-full">${window.LeadScoreService.getScoreText(score.status)} (${score.score}pts)</span>`;
        }
    }

    return badges;
}

function getActiveFiltersSnapshot() {
    const activeFilters = {};

    document.querySelectorAll('.filter-chip.active').forEach((chip) => {
        const filter = chip.dataset.filter;
        if (!filter) {
            return;
        }

        activeFilters[filter] = chip.dataset.value || true;
    });

    return activeFilters;
}

function syncLegacyAppState() {
    legacyAppState.allResults = allResults;
    legacyAppState.currentView = currentView;
    legacyAppState.prospectedPlaces = window.prospectedPlaces;
    legacyAppState.activeFilters = getActiveFiltersSnapshot();
    window.appState = legacyAppState;
}

function installLegacyRuntimeBridge() {
    window.appState = legacyAppState;
    window.applySearchFilters = applyFilters;
    window.toggleView = setView;
    window.exportarCSV = exportarCSV;
    window.exportarPDF = exportarPDF;
    window.mostrarDetalhes = mostrarDetalhes;
    window.getLeadBadges = getLeadBadges;
    syncLegacyAppState();
}

function createEmptyState(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'empty-state';

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'empty-state-icon';

    const icon = document.createElement('i');
    icon.className = 'fas fa-building';
    iconWrapper.appendChild(icon);

    const title = document.createElement('h3');
    title.className = 'text-lg font-medium text-gray-300';
    title.textContent = 'Nenhum resultado encontrado';

    const description = document.createElement('p');
    description.className = 'text-gray-500 mt-1';
    description.textContent = message;

    wrapper.append(iconWrapper, title, description);
    return wrapper;
}

function getPaginationPage(viewType) {
    return viewType === 'grid' ? window.paginationState.gridPage : window.paginationState.listPage;
}

function setPaginationPage(viewType, page) {
    if (viewType === 'grid') {
        window.paginationState.gridPage = page;
    } else {
        window.paginationState.listPage = page;
    }
}

function renderPaginationControls(container, totalPages, currentPage, onPageChange) {
    if (totalPages <= 1) {
        return;
    }

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination flex justify-center items-center gap-2 mt-4 mb-4 p-2 bg-gray-800 rounded col-span-full';

    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-gray-300 text-sm mr-2';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
        const prevIcon = document.createElement('i');
        prevIcon.className = 'fas fa-chevron-left';
        prevBtn.appendChild(prevIcon);
        prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
        paginationContainer.appendChild(prevBtn);
    }

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn px-3 py-1 rounded ${page === currentPage ? 'bg-accent text-white' : 'bg-gray-700 text-gray-300'}`;
        pageBtn.textContent = page;
        pageBtn.addEventListener('click', () => onPageChange(page));
        paginationContainer.appendChild(pageBtn);
    }

    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
        const nextIcon = document.createElement('i');
        nextIcon.className = 'fas fa-chevron-right';
        nextBtn.appendChild(nextIcon);
        nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
        paginationContainer.appendChild(nextBtn);
    }

    container.appendChild(paginationContainer);
}

function hasUnlockedApiKey() {
    const hasLocalAccess = ApiKeyService.hasLocalAccessUnlocked() && hasUnlockableLocalState();
    return Boolean(ApiKeyService.getApiKey() || hasLocalAccess);
}

function hasUnlockableLocalState() {
    if (window.StorageManager && typeof StorageManager.hasUnlockableLocalState === 'function') {
        return StorageManager.hasUnlockableLocalState();
    }

    return ApiKeyService.hasStoredApiKey();
}

function setOnboardingStatus(message, variant = 'info', emphasis = false) {
    const status = document.getElementById('onboardingStatus');
    if (!status) return;

    status.className = 'mt-5 text-sm rounded-xl px-4 py-3';
    if (variant === 'success') {
        status.classList.add('bg-emerald-500/10', 'text-emerald-200', 'border', 'border-emerald-500/20');
    } else if (variant === 'error') {
        status.classList.add('bg-red-500/10', 'text-red-200', 'border', 'border-red-500/20');
    } else if (variant === 'wine') {
        status.classList.add('bg-rose-950/40', 'text-rose-100', 'border', 'border-rose-700/30', 'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]');
    } else if (emphasis) {
        status.classList.add('bg-emerald-500/10', 'text-emerald-100', 'border', 'border-emerald-500/30');
    } else {
        status.classList.add('bg-slate-700/60', 'text-slate-200', 'border', 'border-white/10');
    }

    status.replaceChildren();

    if (emphasis) {
        const badgeRow = document.createElement('div');
        badgeRow.className = 'flex flex-wrap items-center gap-2 mb-3';

        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100';
        badge.textContent = 'Dados locais encontrados';
        badgeRow.appendChild(badge);
        status.appendChild(badgeRow);
    }

    const messageNode = document.createElement('div');
    messageNode.className = emphasis ? 'font-semibold text-emerald-50' : '';
    messageNode.textContent = message;
    status.appendChild(messageNode);
}

function showOnboardingPanel(panelName) {
    const panels = document.querySelectorAll('[data-onboarding-panel]');
    panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.onboardingPanel !== panelName);
    });

    const tabs = document.querySelectorAll('[data-onboarding-tab]');
    tabs.forEach(tab => {
        const isActive = tab.dataset.onboardingTab === panelName;
        tab.classList.toggle('bg-violet-600', isActive);
        tab.classList.toggle('text-white', isActive);
        tab.classList.toggle('border-violet-400/40', isActive);
        tab.classList.toggle('bg-slate-800/70', !isActive);
        tab.classList.toggle('text-slate-300', !isActive);
        tab.classList.toggle('border-white/10', !isActive);
    });
}

function setSetupLocked(isLocked) {
    document.body.classList.toggle('setup-locked', isLocked);
    const gate = document.getElementById('onboardingGate');
    if (gate) {
        gate.classList.toggle('hidden', !isLocked);
    }
}

function setProjectMetadata() {
    const footerYear = document.getElementById('footerYear');
    if (footerYear) {
        footerYear.textContent = String(new Date().getFullYear());
    }

    const projectVersion = document.getElementById('projectVersion');
    if (projectVersion) {
        projectVersion.textContent = window.PROJECT_VERSION || PROJECT_VERSION;
    }
}

function initializeOnboardingGate() {
    const gate = document.getElementById('onboardingGate');
    if (!gate) {
        return;
    }

    const newUseTab = document.getElementById('onboardingNewUseTab');
    const restoreTab = document.getElementById('onboardingRestoreTab');
    const unlockTab = document.getElementById('onboardingUnlockTab');
    const newSubmit = document.getElementById('onboardingNewSubmit');
    const restoreSubmit = document.getElementById('onboardingRestoreSubmit');
    const unlockSubmit = document.getElementById('onboardingUnlockSubmit');
    const newApiKey = document.getElementById('onboardingNewApiKey');
    const newPin = document.getElementById('onboardingNewPin');
    const restoreFile = document.getElementById('onboardingRestoreFile');
    const restorePin = document.getElementById('onboardingRestorePin');
    const unlockPin = document.getElementById('onboardingUnlockPin');
    const hasStoredVault = ApiKeyService.hasStoredApiKey();
    const hasLocalInstallation = hasUnlockableLocalState();

    if (!hasLocalInstallation) {
        ApiKeyService.setLocalAccessUnlocked(false);
    }

    if (unlockTab) {
        unlockTab.classList.toggle('hidden', !hasLocalInstallation);
    }

    const switchPanel = panelName => {
        showOnboardingPanel(panelName);
    };

    newUseTab?.addEventListener('click', () => switchPanel('new'));
    restoreTab?.addEventListener('click', () => switchPanel('restore'));
    unlockTab?.addEventListener('click', () => switchPanel('unlock'));

    newSubmit?.addEventListener('click', async () => {
        const apiKey = newApiKey?.value.trim();
        const pin = newPin?.value.trim();

        if (!apiKey) {
            setOnboardingStatus('Informe sua chave API para continuar.', 'error');
            return;
        }

        if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
            setOnboardingStatus('Formato de chave API inválido. Ela deve começar com AIza.', 'error');
            return;
        }

        try {
            if (window.StorageManager && typeof StorageManager.validateInstallationSecret === 'function') {
                StorageManager.validateInstallationSecret(pin, 'Senha de instalação');
            } else if (!pin || pin.length < 4) {
                throw new Error('A senha precisa ter pelo menos 4 caracteres.');
            }
        } catch (error) {
            setOnboardingStatus(error.message || 'Senha de instalação inválida.', 'error');
            return;
        }

        try {
            newSubmit.disabled = true;
            setOnboardingStatus('Validando a chave e salvando com senha local...', 'info');
            await ApiKeyService.validateAndSaveApiKey(apiKey, pin);
            if (window.StorageManager && typeof StorageManager.setInstallationMarker === 'function') {
                StorageManager.setInstallationMarker(true);
            }
            ApiKeyService.setLocalAccessUnlocked(false);
            setOnboardingStatus('Chave validada e protegida. Abrindo o sistema...', 'success');
            await resumeAfterOnboardingSuccess();
        } catch (error) {
            console.error('Falha ao configurar a chave API:', error);
            setOnboardingStatus(error.message || 'Não foi possível validar a chave API.', 'error');
        } finally {
            newSubmit.disabled = false;
        }
    });

    restoreSubmit?.addEventListener('click', async () => {
        const file = restoreFile?.files?.[0];
        const masterPin = restorePin?.value.trim();

        if (!file) {
            setOnboardingStatus('Selecione um arquivo de backup para restaurar.', 'error');
            return;
        }

        if (!masterPin) {
            setOnboardingStatus('Informe a senha da instalação para restaurar o backup.', 'error');
            return;
        }

        try {
            restoreSubmit.disabled = true;
            setOnboardingStatus('Restaurando backup local...', 'info');

            const result = await StorageManager.importData(file, { pin: masterPin });
            if (!result.success) {
                throw new Error(result.message || 'Falha ao restaurar backup');
            }

            if (window.StorageManager && typeof StorageManager.setInstallationMarker === 'function') {
                StorageManager.setInstallationMarker(true);
            }

            if (ApiKeyService.hasStoredApiKey()) {
                const unlocked = await ApiKeyService.unlockApiKey(masterPin);
                if (!unlocked) {
                    throw new Error('Não foi possível destravar a chave API restaurada.');
                }

                setOnboardingStatus('Backup restaurado e API liberada. Abrindo o sistema...', 'success');
                await resumeAfterOnboardingSuccess();
                return;
            }

            setOnboardingStatus('Backup restaurado. Se este snapshot não trouxer a chave API, use "Primeiro uso" para informar a chave com a mesma senha.', 'warning');
            switchPanel('new');
        } catch (error) {
            console.error('Falha ao restaurar backup:', error);
            setOnboardingStatus(error.message || 'Não foi possível restaurar o backup.', 'error');
        } finally {
            restoreSubmit.disabled = false;
        }
    });

    unlockSubmit?.addEventListener('click', async () => {
        const pin = unlockPin?.value.trim();

        if (!pin) {
            setOnboardingStatus('Informe a senha da instalação para continuar.', 'error');
            return;
        }

        if (!hasUnlockableLocalState()) {
            setOnboardingStatus('Não há dados locais nesta instalação para desbloquear.', 'error');
            return;
        }

        try {
            unlockSubmit.disabled = true;
            setOnboardingStatus('Destravando o acesso local...', 'info');

            if (window.StorageManager && typeof StorageManager.validateInstallationPin === 'function') {
                await StorageManager.validateInstallationPin(pin);
            } else {
                throw new Error('Validador da senha de instalação indisponível nesta instalação.');
            }

            if (!hasUnlockableLocalState()) {
                throw new Error('Não há dados locais vinculados para liberar nesta instalação.');
            }

            ApiKeyService.setLocalAccessUnlocked(true);

            setOnboardingStatus('Acesso local liberado. Abrindo o sistema...', 'success');
            await resumeAfterOnboardingSuccess();
        } catch (error) {
            console.error('Falha ao destravar a chave API:', error);
            setOnboardingStatus(error.message || 'Não foi possível destravar a chave API.', 'error');
        } finally {
            unlockSubmit.disabled = false;
        }
    });

    if (hasLocalInstallation) {
        switchPanel('unlock');
        setOnboardingStatus(
            hasStoredVault
                ? 'Instalação encontrada. Informe o PIN para desbloquear a API e continuar.'
                : 'Dados locais encontrados. Informe o PIN para continuar sem recriar a instalação.',
            'info',
            true
        );
    } else {
        switchPanel('new');
        setOnboardingStatus(
            'Primeiro acesso detectado. Está tudo certo: siga em Primeiro uso para criar a chave API e liberar a instalação.',
            'wine'
        );
    }

    setSetupLocked(true);
}

function createResultListItem(result, index) {
    const resultItem = document.createElement('div');
    resultItem.className = `result-item p-4 hover:bg-gray-700 transition-colors duration-200 ${prospectedPlaces.has(result.placeId) ? 'prospected-item' : ''}`;

    const container = document.createElement('div');
    container.className = 'flex flex-col md:flex-row md:items-center justify-between gap-4 relative';

    if (result.foto) {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden';

        const photo = document.createElement('img');
        photo.src = safeUrl(result.foto);
        photo.alt = escapeHtml(result.nome);
        photo.className = 'w-full h-full object-cover';
        photo.addEventListener('error', () => {
            photo.src = 'assets/images/no-image.webp';
        });

        photoWrapper.appendChild(photo);
        container.appendChild(photoWrapper);
    }

    const mainInfo = document.createElement('div');
    mainInfo.className = 'flex-1 min-w-0';

    const name = document.createElement('h3');
    name.className = 'text-lg font-semibold text-white truncate';
    name.textContent = escapeHtml(result.nome);

    const address = document.createElement('p');
    address.className = 'text-gray-400 text-sm';
    address.textContent = escapeHtml(result.endereco);

    const contacts = document.createElement('div');
    contacts.className = 'mt-3 flex flex-wrap gap-6';

    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'flex items-center text-sm';
    const phoneIcon = document.createElement('i');
    phoneIcon.className = 'fas fa-phone text-gray-400 mr-2';
    const phoneText = document.createElement('span');
    phoneText.className = 'text-gray-200';
    phoneText.textContent = escapeHtml(result.telefone);
    phoneGroup.append(phoneIcon, phoneText);

    const websiteGroup = document.createElement('div');
    websiteGroup.className = 'flex items-center text-sm';
    const websiteIcon = document.createElement('i');
    websiteIcon.className = 'fas fa-globe text-gray-400 mr-2';
    websiteGroup.append(websiteIcon, createWebsiteNode(result.website));

    contacts.append(phoneGroup, websiteGroup);
    mainInfo.append(name, address, contacts);

    const rightColumn = document.createElement('div');
    rightColumn.className = 'flex flex-col items-end';
    rightColumn.appendChild(createRatingNode(result.avaliacao, result.totalAvaliacoes));

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2 mt-2';

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn-secondary px-3 py-1 rounded-lg text-sm view-details-btn';
    detailsButton.dataset.index = String(index);
    const detailsIcon = document.createElement('i');
    detailsIcon.className = 'fas fa-eye mr-1';
    detailsButton.append(detailsIcon, document.createTextNode(' Mais Detalhes'));

    actions.append(detailsButton, createProspectedBadge(result));
    rightColumn.appendChild(actions);

    container.append(mainInfo, rightColumn);
    resultItem.appendChild(container);
    return resultItem;
}

function createResultGridCard(result, index) {
    const card = document.createElement('div');
    card.className = `grid-card bg-gray-800 rounded-lg overflow-hidden border border-gray-700 ${prospectedPlaces.has(result.placeId) ? 'prospected-item' : ''}`;

    const header = document.createElement('div');
    header.className = 'grid-card-header p-4 border-b border-gray-700';

    if (result.foto) {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'w-full h-48 mb-4 rounded-lg overflow-hidden';

        const photo = document.createElement('img');
        photo.src = safeUrl(result.foto);
        photo.alt = escapeHtml(result.nome);
        photo.className = 'w-full h-full object-cover';
        photo.addEventListener('error', () => {
            photo.src = 'assets/images/no-image.webp';
        });

        photoWrapper.appendChild(photo);
        header.appendChild(photoWrapper);
    }

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-white truncate';
    title.textContent = escapeHtml(result.nome);
    header.appendChild(title);

    if (result.avaliacao !== 'Não avaliado') {
        const rating = document.createElement('div');
        rating.className = 'flex items-center mt-2 bg-gray-700 rounded-full px-3 py-1 w-fit';
        rating.appendChild(createRatingNode(result.avaliacao, result.totalAvaliacoes));
        header.appendChild(rating);
    }

    const body = document.createElement('div');
    body.className = 'grid-card-body p-4 space-y-4';

    const addressBlock = document.createElement('div');
    const addressLabel = document.createElement('div');
    addressLabel.className = 'text-gray-400 text-xs mb-1';
    addressLabel.textContent = 'ENDEREÇO';
    const addressValue = document.createElement('p');
    addressValue.className = 'text-sm text-gray-200';
    addressValue.textContent = escapeHtml(result.endereco);
    addressBlock.append(addressLabel, addressValue);

    const phoneBlock = document.createElement('div');
    const phoneLabel = document.createElement('div');
    phoneLabel.className = 'text-gray-400 text-xs mb-1';
    phoneLabel.textContent = 'TELEFONE';
    const phoneValue = document.createElement('p');
    phoneValue.className = 'text-sm text-gray-200';
    phoneValue.textContent = escapeHtml(result.telefone);
    phoneBlock.append(phoneLabel, phoneValue);

    const websiteBlock = document.createElement('div');
    const websiteLabel = document.createElement('div');
    websiteLabel.className = 'text-gray-400 text-xs mb-1';
    websiteLabel.textContent = 'WEBSITE';
    websiteBlock.append(websiteLabel, createWebsiteNode(result.website));

    body.append(addressBlock, phoneBlock, websiteBlock);

    const footer = document.createElement('div');
    footer.className = 'grid-card-footer p-4 border-t border-gray-700 flex justify-between items-center gap-2';

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn-secondary px-3 py-1 rounded-lg text-sm view-details-btn';
    detailsButton.dataset.index = String(index);
    const detailsIcon = document.createElement('i');
    detailsIcon.className = 'fas fa-eye mr-1';
    detailsButton.append(detailsIcon, document.createTextNode(' Detalhes'));

    footer.append(detailsButton, createProspectedBadge(result));

    card.append(header, body, footer);
    return card;
}

// Funções de gerenciamento do modal da API Key
function setupApiKeyModal() {
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyBtn = document.getElementById('apiKeyBtn');
    const closeApiKeyModalBtn = document.getElementById('closeApiKeyModalBtn');
    const clearKeyBtn = document.getElementById('clearKeyBtn');
    const validateKeyBtn = document.getElementById('validateKeyBtn');
    const apiKeyInput = document.getElementById('apiKey');

    function renderApiKeyButton(isConnected = false) {
        if (!apiKeyBtn) {
            return;
        }

        const hasStoredVault = ApiKeyService.hasStoredApiKey();
        const icon = document.createElement('div');
        icon.className = 'download-option-icon';
        icon.classList.toggle('text-emerald-300', isConnected);
        icon.classList.toggle('text-slate-300', !isConnected);

        const iconGlyph = document.createElement('span');
        iconGlyph.className = 'material-icons';
        iconGlyph.style.fontSize = '20px';
        iconGlyph.textContent = isConnected ? 'verified' : 'vpn_key';
        icon.appendChild(iconGlyph);

        const copy = document.createElement('div');
        copy.className = 'flex-1 min-w-0';

        const title = document.createElement('h4');
        title.className = 'font-medium text-white';
        title.textContent = isConnected
            ? 'API conectada'
            : hasStoredVault
                ? 'Destravar API'
                : 'Conectar API';

        const description = document.createElement('p');
        description.className = 'text-sm text-gray-400';
        description.textContent = isConnected
            ? 'Chave validada e liberada na sessão atual'
            : hasStoredVault
                ? 'A chave já existe neste navegador, mas precisa ser liberada nesta sessão'
                : 'Validar, destravar ou trocar a chave do Google Places';

        copy.append(title, description);

        apiKeyBtn.classList.toggle('api-key-validated', isConnected);
        apiKeyBtn.classList.toggle('border-emerald-400/20', isConnected);
        apiKeyBtn.classList.toggle('bg-emerald-500/[0.04]', isConnected);
        apiKeyBtn.classList.toggle('border-white/10', !isConnected);
        apiKeyBtn.classList.toggle('bg-white/5', !isConnected);
        apiKeyBtn.replaceChildren(icon, copy);
    }

    // Função para fechar o modal
    function closeApiKeyModal() {
        if (apiKeyModal) {
            apiKeyModal.classList.add('hidden');
        }
    }

    function showApiKeyInfo(message, iconClass = 'fas fa-lock text-amber-400 mr-2') {
        const validationResult = document.getElementById('keyValidationResult');
        const validationIcon = document.getElementById('validationIcon');
        const validationMessage = document.getElementById('validationMessage');

        if (validationResult && validationIcon && validationMessage) {
            validationResult.classList.remove('hidden');
            validationIcon.className = iconClass;
            validationMessage.textContent = message;
            apiKeyInput.classList.remove('api-key-invalid');
        }
    }

    // Função para abrir o modal
    function openApiKeyModal() {
        if (apiKeyModal) {
            const backupModal = document.getElementById('backupModal');
            if (backupModal) {
                backupModal.classList.add('hidden');
            }

            apiKeyModal.classList.remove('hidden');
            const savedKey = ApiKeyService.getApiKey();
            if (savedKey) {
                apiKeyInput.value = savedKey;
            }

            if (validateKeyBtn) {
                validateKeyBtn.innerHTML = ApiKeyService.hasStoredApiKey() ? 'Atualizar' : 'Validar';
            }

            if (!savedKey && ApiKeyService.hasStoredApiKey()) {
                showApiKeyInfo('Esta instalação já possui uma chave salva. Digite a senha ao validar para destravar ou substituir a API.');
            }
        }
    }

    // Função para mostrar erro de validação
    function showValidationError(message) {
        const validationResult = document.getElementById('keyValidationResult');
        const validationIcon = document.getElementById('validationIcon');
        const validationMessage = document.getElementById('validationMessage');

        if (validationResult && validationIcon && validationMessage) {
            validationResult.classList.remove('hidden');
            validationIcon.className = 'fas fa-times-circle text-red-500 mr-2';
            validationMessage.textContent = message;
            apiKeyInput.classList.add('api-key-invalid');
            apiKeyInput.classList.remove('api-key-valid');
        }
    }

    // Função para mostrar sucesso na validação
    function showValidationSuccess(message = 'Chave API válida e funcionando') {
        const validationResult = document.getElementById('keyValidationResult');
        const validationIcon = document.getElementById('validationIcon');
        const validationMessage = document.getElementById('validationMessage');

        if (validationResult && validationIcon && validationMessage) {
            validationResult.classList.remove('hidden');
            validationIcon.className = 'fas fa-check-circle text-green-500 mr-2';
            validationMessage.textContent = message;
            apiKeyInput.classList.add('api-key-valid');
            apiKeyInput.classList.remove('api-key-invalid');
            renderApiKeyButton(true);
        }
    }

    // Event Listeners
    if (apiKeyBtn) {
        apiKeyBtn.addEventListener('click', openApiKeyModal);
    }

    if (closeApiKeyModalBtn) {
        closeApiKeyModalBtn.addEventListener('click', closeApiKeyModal);
    }

    if (apiKeyModal) {
        apiKeyModal.addEventListener('click', (e) => {
            if (e.target === apiKeyModal) {
                closeApiKeyModal();
            }
        });
    }

    if (clearKeyBtn) {
        clearKeyBtn.addEventListener('click', () => {
            ApiKeyService.clearApiKey();
            if (apiKeyInput) {
                apiKeyInput.value = '';
                apiKeyInput.classList.remove('api-key-valid', 'api-key-invalid');
            }
            const keyValidationResult = document.getElementById('keyValidationResult');
            if (keyValidationResult) {
                keyValidationResult.classList.add('hidden');
            }
            renderApiKeyButton(false);
            location.reload();
        });
    }

    if (validateKeyBtn && apiKeyInput) {
        validateKeyBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();


            try {
                validateKeyBtn.disabled = true;
                validateKeyBtn.replaceChildren();
                const spinnerIcon = document.createElement('i');
                spinnerIcon.className = 'fas fa-spinner fa-spin mr-2';
                validateKeyBtn.append(spinnerIcon, 'Validando...');

                let pin = ApiKeyService.getSessionPin();
                if (!pin) {
                    pin = await requestMaskedPin({
                        title: ApiKeyService.hasStoredApiKey() ? 'Liberar ou atualizar chave API' : 'Salvar chave API',
                        description: 'Digite a senha da instalação. A API e o cofre local usam a mesma proteção.',
                        label: 'Senha da instalação',
                        validate: value => StorageManager.validateInstallationPin(value)
                    });
                }
                if (!pin) {
                    showValidationError('É necessário informar a senha da instalação para atualizar a chave API');
                    return;
                }

                if (!apiKey) {
                    if (!ApiKeyService.hasStoredApiKey()) {
                        showValidationError('Por favor, digite sua chave API');
                        return;
                    }

                    const unlockedKey = await ApiKeyService.unlockApiKey(pin);
                    if (!unlockedKey) {
                        throw new Error('Não foi possível destravar a chave API com a senha informada.');
                    }

                    apiKeyInput.value = unlockedKey;
                    showValidationSuccess('Chave API destravada e liberada nesta sessão.');

                    setTimeout(() => {
                        closeApiKeyModal();
                        refreshAfterApiKeySave();
                    }, 700);
                    return;
                }

                if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
                    showValidationError('Formato de chave API inválido (deve começar com AIza)');
                    return;
                }

                await ApiKeyService.validateAndSaveApiKey(apiKey, pin);
                showValidationSuccess('Chave API válida e protegida com a senha da instalação.');

                // Fechar o modal e forçar refresh da página
                setTimeout(() => {
                    closeApiKeyModal();
                    // Força o refresh da página para garantir que tudo seja recarregado
                    refreshAfterApiKeySave();
                }, 1000);

            } catch (error) {
                console.error('Erro ao validar chave API:', error);
                showValidationError(error.message || 'Erro ao validar a chave API. Verifique o console para mais detalhes.');
            } finally {
                if (validateKeyBtn) {
                    validateKeyBtn.disabled = false;
                    validateKeyBtn.innerHTML = ApiKeyService.hasStoredApiKey() ? 'Atualizar' : 'Validar';
                }
            }
        });
    }

    // Carregar chave API salva se existir na sessao atual
    const savedApiKey = ApiKeyService.getApiKey();
    if (savedApiKey && apiKeyInput) {
        apiKeyInput.value = savedApiKey;
        apiKeyInput.classList.add('api-key-valid');
        renderApiKeyButton(true);
    } else {
        renderApiKeyButton(false);
    }
}

// Função para verificar se a chave API está salva
function getSavedApiKey() {
    return ApiKeyService.getApiKey();
}

// Função para salvar a chave API
async function saveApiKey(apiKey) {
    const pin = await requestMaskedPin({
        title: 'Salvar chave API',
        description: 'Digite a senha da instalação para proteger a chave API.',
        label: 'Senha da instalação',
        validate: value => StorageManager.validateInstallationPin(value)
    });
    if (!pin) {
        return false;
    }

    await ApiKeyService.validateAndSaveApiKey(apiKey, pin);
    return true;
}

// Função para limpar a chave API
function clearApiKey() {
    ApiKeyService.clearApiKey();
}

// Função para inicializar os serviços do Google Maps
async function initializeGoogleMaps(apiKey) {
    try {
        console.log('Carregando API do Google Maps...');
        await ApiKeyService.loadGoogleMapsAPI(apiKey);
        console.log('API do Google Maps carregada com sucesso');

        // Inicializar serviços
        placesService = new PlacesService();
        await placesService.validateApiKey();
        console.log('Chave API validada com sucesso');

        // Inicializar mapa
        mapService = new MapService();
        await mapService.initializeMap();
        console.log('Mapa inicializado');

        // Inicializar geocoder
        geocoder = new google.maps.Geocoder();

        // Inicializar autocomplete
        await initializeAutocomplete();

        // Configurar event listeners
        setupSearchEventListeners();
        
        return true;
    } catch (error) {
        console.error('Erro ao inicializar serviços do Google Maps:', error);
        return false;
    }
}

async function initializeApp() {
    try {
        setProjectMetadata();
        setupApiKeyModal();

        const hasLocalInstallation = hasUnlockableLocalState();
        const hasUnlockedLocalAccess = ApiKeyService.hasLocalAccessUnlocked() && hasLocalInstallation;

        if (hasUnlockedLocalAccess) {
            setSetupLocked(false);
        }

        if (!hasUnlockedApiKey()) {
            if (hasLocalInstallation && !ApiKeyService.hasStoredApiKey()) {
                setSetupLocked(true);
                initializeOnboardingGate();
                return;
            }

            initializeOnboardingGate();
            return;
        }

        setSetupLocked(false);

        // Verificar se veio com parâmetro ?session= da página de histórico
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        if (sessionId && window.SearchHistoryService) {
            const session = window.SearchHistoryService.getSession(sessionId);
            if (session && session.companies && session.companies.length > 0) {
                allResults = session.companies.map(c => ({
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

                // Limpar parâmetro da URL sem recarregar
                window.history.replaceState({}, document.title, window.location.pathname);

                // Mostrar banner informativo
                const banner = document.createElement('div');
                banner.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-purple-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm';
                const bannerIcon = document.createElement('span');
                bannerIcon.className = 'material-icons';
                bannerIcon.style.fontSize = '18px';
                bannerIcon.textContent = 'history';
                const bannerText = document.createElement('span');
                bannerText.append(
                    `Carregadas ${session.companies.length} empresas de "`
                );
                const bannerStrong = document.createElement('strong');
                bannerStrong.textContent = session.searchTerm || 'consulta anterior';
                bannerText.append(bannerStrong, '"');
                banner.append(bannerIcon, bannerText);
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 4000);
            }
        }

        // Verificar se a aplicação já foi inicializada
        if (window.google && window.google.maps && placesService) {
            console.log('Aplicação já inicializada');
            // Se temos resultados do histórico, exibir agora
            if (allResults.length > 0) {
                const countEl = document.getElementById('resultCount');
                if (countEl) countEl.textContent = `${allResults.length} resultado${allResults.length !== 1 ? 's' : ''}`;
                applyFilters();
            }
            return;
        }

        // Verificar se existe uma chave API destravada ou vault persistido
        let apiKey = ApiKeyService.getApiKey();
        if (!apiKey && ApiKeyService.hasStoredApiKey() && !hasUnlockedLocalAccess) {
            const pin = await requestMaskedPin({
                title: 'Destravar chave API',
                description: 'Digite a senha da instalação para liberar a chave salva.',
                label: 'Senha da instalação'
            });
            if (pin) {
                try {
                    apiKey = await ApiKeyService.unlockApiKey(pin);
                } catch (error) {
                    console.warn('Falha ao destravar a API key:', error);
                }
            }
        }

        console.log('Verificando chave API:', apiKey ? 'Encontrada' : 'Não encontrada');

        if (!apiKey) {
            if (hasUnlockedLocalAccess) {
                setSetupLocked(false);
                setupApiKeyModal();
                const onboardingStatus = document.getElementById('onboardingStatus');
                if (onboardingStatus) {
                    onboardingStatus.textContent = 'Dados locais liberados. A extração continua bloqueada até a API ser configurada.';
                }

                if (allResults.length > 0) {
                    const countEl = document.getElementById('resultCount');
                    if (countEl) countEl.textContent = `${allResults.length} resultado${allResults.length !== 1 ? 's' : ''}`;
                    applyFilters();
                }

                return;
            }

            // Se temos resultados do histórico, exibir mesmo sem API
            if (allResults.length > 0) {
                const countEl = document.getElementById('resultCount');
                if (countEl) countEl.textContent = `${allResults.length} resultado${allResults.length !== 1 ? 's' : ''}`;
                applyFilters();
            }
            // Não mostra erro, apenas abre o modal
            openApiKeyModal();
            return;
        }

        // Tenta inicializar o Google Maps com a chave salva
        const initialized = await initializeGoogleMaps(apiKey);
        
        if (!initialized) {
            // Se falhar, limpa a chave inválida e mostra o modal
            ApiKeyService.clearApiKey();
            openApiKeyModal();
        }

        // Se temos resultados do histórico, exibir após inicialização
        if (allResults.length > 0) {
            const countEl = document.getElementById('resultCount');
            if (countEl) countEl.textContent = `${allResults.length} resultado${allResults.length !== 1 ? 's' : ''}`;
            applyFilters();
        }

    } catch (error) {
        console.error('Erro na inicialização do app:', error);
        // Não mostra mensagem de erro genérica para o usuário
    }
}

// Função para forçar o refresh da página após salvar a chave API
function refreshAfterApiKeySave() {
    // Força um bootstrap limpo para reduzir cache agressivo em file:// e em recargas locais.
    setTimeout(() => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('boot', Date.now().toString());
        window.location.replace(currentUrl.toString());
    }, 500);
}

async function resumeAfterOnboardingSuccess() {
    setSetupLocked(false);

    try {
        await initializeApp();

        if (!document.body.classList.contains('setup-locked')) {
            return true;
        }
    } catch (error) {
        console.error('Falha ao retomar o app apos onboarding:', error);
    }

    refreshAfterApiKeySave();
    return false;
}

function normalizeLocationText(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function clearSelectedLocationPrediction() {
    window.lastSelectedPlace = null;
    window.lastSelectedPlaceText = '';
}

function getLocationInputValue(inputElement) {
    if (!inputElement) return '';

    if (typeof inputElement.value === 'string') {
        return inputElement.value.trim();
    }

    return '';
}

function isCoordinateString(value) {
    return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

async function ensureLocationAutocompleteLibrary() {
    if (locationAutocompleteState.placesLibrary) {
        return locationAutocompleteState.placesLibrary;
    }

    if (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
        throw new Error('Biblioteca Places (New) não disponível para autocomplete');
    }

    locationAutocompleteState.placesLibrary = await google.maps.importLibrary('places');
    return locationAutocompleteState.placesLibrary;
}

async function refreshLocationAutocompleteSessionToken() {
    const placesLibrary = await ensureLocationAutocompleteLibrary();

    if (!locationAutocompleteState.request) {
        locationAutocompleteState.request = {
            input: '',
            includedRegionCodes: ['br'],
            language: 'pt-BR',
            region: 'br'
        };
    }

    locationAutocompleteState.request.sessionToken = new placesLibrary.AutocompleteSessionToken();
}

function getLocationSuggestionsContainer() {
    return document.getElementById('locationSuggestions');
}

function hideLocationSuggestions() {
    const suggestionsContainer = getLocationSuggestionsContainer();
    const autocompleteShell = document.getElementById('locationAutocomplete');

    locationAutocompleteState.suggestions = [];
    locationAutocompleteState.activeIndex = -1;

    if (suggestionsContainer) {
        suggestionsContainer.hidden = true;
        suggestionsContainer.replaceChildren();
    }

    if (autocompleteShell) {
        autocompleteShell.classList.remove('is-open');
    }
}

function setActiveLocationSuggestion(nextIndex) {
    const suggestionsContainer = getLocationSuggestionsContainer();
    if (!suggestionsContainer) return;

    const buttons = suggestionsContainer.querySelectorAll('.location-autocomplete-option');
    if (!buttons.length) {
        locationAutocompleteState.activeIndex = -1;
        return;
    }

    locationAutocompleteState.activeIndex = nextIndex;
    buttons.forEach((button, index) => {
        const isActive = index === nextIndex;
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
            button.scrollIntoView({ block: 'nearest' });
        }
    });
}

async function selectLocationSuggestion(index) {
    const locationInput = document.getElementById('location');
    const selectedSuggestion = locationAutocompleteState.suggestions[index];
    if (!locationInput || !selectedSuggestion?.placePrediction) {
        return;
    }

    const place = selectedSuggestion.placePrediction.toPlace();
    await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location']
    });

    const resolvedText = place.formattedAddress || place.displayName || selectedSuggestion.placePrediction.text?.toString() || '';
    locationInput.value = resolvedText;
    window.lastSelectedPlace = place;
    window.lastSelectedPlaceText = resolvedText;

    hideLocationSuggestions();
    await refreshLocationAutocompleteSessionToken();
}

function renderLocationSuggestions() {
    const suggestionsContainer = getLocationSuggestionsContainer();
    const autocompleteShell = document.getElementById('locationAutocomplete');
    if (!suggestionsContainer || !autocompleteShell) {
        return;
    }

    suggestionsContainer.replaceChildren();

    if (!locationAutocompleteState.suggestions.length) {
        hideLocationSuggestions();
        return;
    }

    const list = document.createElement('ul');
    list.className = 'location-autocomplete-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Sugestões de localização');

    locationAutocompleteState.suggestions.forEach((suggestion, index) => {
        if (!suggestion.placePrediction) return;

        const item = document.createElement('li');
        item.className = 'location-autocomplete-item';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'location-autocomplete-option';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');

        const text = document.createElement('span');
        text.className = 'location-autocomplete-text';
        text.textContent = suggestion.placePrediction.text?.toString() || 'Sugestão';

        button.appendChild(text);
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
        });
        button.addEventListener('click', () => {
            void selectLocationSuggestion(index);
        });

        item.appendChild(button);
        list.appendChild(item);
    });

    suggestionsContainer.appendChild(list);
    suggestionsContainer.hidden = false;
    autocompleteShell.classList.add('is-open');
    setActiveLocationSuggestion(locationAutocompleteState.activeIndex >= 0 ? locationAutocompleteState.activeIndex : 0);
}

async function fetchLocationSuggestions() {
    const locationInput = document.getElementById('location');
    if (!locationInput) {
        return;
    }

    const query = getLocationInputValue(locationInput);
    if (!query || isCoordinateString(query)) {
        hideLocationSuggestions();
        return;
    }

    const requestId = ++locationAutocompleteState.newestRequestId;

    try {
        const placesLibrary = await ensureLocationAutocompleteLibrary();
        if (!locationAutocompleteState.request?.sessionToken) {
            await refreshLocationAutocompleteSessionToken();
        }

        locationAutocompleteState.request.input = query;

        const mapCenter = mapService?.getMapCenter?.();
        if (mapCenter) {
            locationAutocompleteState.request.origin = mapCenter;
            locationAutocompleteState.request.locationBias = {
                radius: 50000,
                center: mapCenter
            };
        } else {
            delete locationAutocompleteState.request.origin;
            delete locationAutocompleteState.request.locationBias;
        }

        const { suggestions } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(locationAutocompleteState.request);
        if (requestId !== locationAutocompleteState.newestRequestId) {
            return;
        }

        locationAutocompleteState.suggestions = suggestions.filter((suggestion) => suggestion.placePrediction);
        locationAutocompleteState.activeIndex = locationAutocompleteState.suggestions.length ? 0 : -1;
        renderLocationSuggestions();
    } catch (error) {
        console.error('Erro ao buscar sugestões de local:', error);
        hideLocationSuggestions();
    }
}

function scheduleLocationSuggestionsFetch() {
    if (locationAutocompleteState.debounceTimer) {
        clearTimeout(locationAutocompleteState.debounceTimer);
    }

    locationAutocompleteState.debounceTimer = setTimeout(() => {
        void fetchLocationSuggestions();
    }, LOCATION_AUTOCOMPLETE_DEBOUNCE_MS);
}

async function initializeAutocomplete() {
    const locationInput = document.getElementById('location');
    const suggestionsContainer = getLocationSuggestionsContainer();
    if (!locationInput || !suggestionsContainer || !window.google || !window.google.maps) {
        console.warn('Elemento de localização ou API do Google Maps não encontrado');
        return;
    }

    try {
        await ensureLocationAutocompleteLibrary();
        if (locationAutocompleteState.initialized) {
            console.log('Autocomplete de local já inicializado com Autocomplete Data');
            return;
        }

        await refreshLocationAutocompleteSessionToken();

        locationInput.setAttribute('autocomplete', 'off');

        locationInput.addEventListener('input', () => {
            const currentValue = getLocationInputValue(locationInput);
            if (normalizeLocationText(currentValue) !== normalizeLocationText(window.lastSelectedPlaceText)) {
                clearSelectedLocationPrediction();
            }

            scheduleLocationSuggestionsFetch();
        });

        locationInput.addEventListener('focus', () => {
            if (locationAutocompleteState.blurTimer) {
                clearTimeout(locationAutocompleteState.blurTimer);
            }

            if (locationAutocompleteState.suggestions.length) {
                renderLocationSuggestions();
            }
        });

        locationInput.addEventListener('blur', () => {
            locationAutocompleteState.blurTimer = setTimeout(() => {
                hideLocationSuggestions();
            }, 120);
        });

        locationInput.addEventListener('keydown', (event) => {
            if (!locationAutocompleteState.suggestions.length) {
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                const nextIndex = Math.min(
                    locationAutocompleteState.activeIndex + 1,
                    locationAutocompleteState.suggestions.length - 1
                );
                setActiveLocationSuggestion(nextIndex);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                const nextIndex = Math.max(locationAutocompleteState.activeIndex - 1, 0);
                setActiveLocationSuggestion(nextIndex);
            } else if (event.key === 'Enter') {
                if (locationAutocompleteState.activeIndex >= 0) {
                    event.preventDefault();
                    void selectLocationSuggestion(locationAutocompleteState.activeIndex);
                }
            } else if (event.key === 'Escape') {
                hideLocationSuggestions();
            }
        });

        locationAutocompleteState.initialized = true;
        console.log('Autocomplete inicializado com Autocomplete Data (Places New)');
    } catch (error) {
        console.error('Erro ao inicializar autocomplete:', error);
    }
}

function setupSearchEventListeners() {
    // Configurar evento de pesquisa
    const startSearchBtn = document.getElementById('startSearchBtn');
    if (startSearchBtn) {
        startSearchBtn.addEventListener('click', performSearch);
    }
    
    // Configurar eventos para os filtros
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
        chip.style.transition = 'all 0.2s ease-in-out';
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const filter = chip.dataset.filter;
            const value = chip.dataset.value || true;
            
            // Toggle do filtro
            chip.classList.toggle('active');
            
            // Garantir que apenas um filtro de cada tipo esteja ativo
            if (chip.classList.contains('active')) {
                // Desativar outros filtros do mesmo tipo
                document.querySelectorAll(`.filter-chip[data-filter="${filter}"]`).forEach(otherChip => {
                    if (otherChip !== chip) {
                        otherChip.classList.remove('active');
                    }
                });
            }
            
            // Aplicar filtros se houver resultados
            if (allResults && allResults.length > 0) {
                applyFilters();
            }
        });
    });
    
    // Configurar evento para ocultar prospectados
    const hideProspectedBtn = document.getElementById('hideProspectedBtn');
    if (hideProspectedBtn) {
        hideProspectedBtn.addEventListener('click', () => {
            hideProspectedBtn.classList.toggle('active');
            
            if (hideProspectedBtn.classList.contains('active')) {
                setButtonIconText(hideProspectedBtn, 'fas fa-eye mr-2', 'Mostrar Prospectados', 'text-sm');
            } else {
                setButtonIconText(hideProspectedBtn, 'fas fa-eye-slash mr-2 text-gray-400', 'Ocultar Prospectados', 'text-sm');
            }
            
            // Aplicar filtros se houver resultados
            if (allResults.length > 0) {
                applyFilters();
            }
        });
    }
    
    // Configurar eventos para os botões de visualização
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (listViewBtn && gridViewBtn) {
        // Remover event listeners anteriores (se existirem)
        const newListViewBtn = listViewBtn.cloneNode(true);
        const newGridViewBtn = gridViewBtn.cloneNode(true);
        
        listViewBtn.parentNode.replaceChild(newListViewBtn, listViewBtn);
        gridViewBtn.parentNode.replaceChild(newGridViewBtn, gridViewBtn);
        
        // Adicionar novos event listeners
        newListViewBtn.addEventListener('click', () => {
            console.log('Alterando para visualização de lista');
            setView('list');
        });
        
        newGridViewBtn.addEventListener('click', () => {
            console.log('Alterando para visualização de grid');
            setView('grid');
        });
        
        // Definir visualização inicial
        setView(currentView);
    }
    
    // Configurar evento para o botão de download
    const downloadBtn = document.getElementById('downloadBtn');
    const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');
    const downloadModal = document.getElementById('downloadModal');
    
    if (downloadBtn && downloadModal) {
        downloadBtn.addEventListener('click', () => {
            downloadModal.classList.remove('hidden');
        });
    }
    
    if (closeDownloadModalBtn && downloadModal) {
        closeDownloadModalBtn.addEventListener('click', () => {
            downloadModal.classList.add('hidden');
        });
    }
    
    // Fechar modal de download ao clicar fora
    if (downloadModal) {
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) {
                downloadModal.classList.add('hidden');
            }
        });
    }
    
    // Configurar eventos para opções de download
    const downloadCsv = document.getElementById('downloadCsv');
    const downloadPdf = document.getElementById('downloadPdf');
    
    if (downloadCsv) {
        downloadCsv.addEventListener('click', () => {
            exportarCSV();
            downloadModal.classList.add('hidden');
        });
    }
    
    if (downloadPdf) {
        downloadPdf.addEventListener('click', () => {
            exportarPDF();
            downloadModal.classList.add('hidden');
        });
    }
}

async function performSearch() {
    try {
        const searchInput = document.getElementById('searchTerm');
        const locationInput = document.getElementById('location');
        const radiusInput = document.getElementById('radius');
        const maxResultsInput = document.getElementById('maxResults');
        const loadingBar = document.querySelector('.loading-bar');
        
        // Validação mais robusta dos elementos
        const missingElements = [];
        if (!searchInput) missingElements.push('Campo de busca');
        if (!locationInput) missingElements.push('Campo de localização');
        if (!radiusInput) missingElements.push('Campo de raio');
        if (!maxResultsInput) missingElements.push('Campo de máximo de resultados');
        
        if (missingElements.length > 0) {
            throw new Error(`Elementos não encontrados: ${missingElements.join(', ')}`);
        }
        
        const query = searchInput.value.trim();
        const location = getLocationInputValue(locationInput);
        const radius = parseInt(radiusInput.value);
        const maxResults = parseInt(maxResultsInput.value);
        
        if (!query || !location) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        // Mostrar loading
        if (loadingBar) loadingBar.style.width = '50%';
        
        // Obter coordenadas
        const coordinates = await obterCoordenadas(location);
        console.log('Coordenadas obtidas:', coordinates);
        
        // Exibir mapa com a localização central
        exibirMapa(coordinates);
        
        // Verificar apenas fotos para buscar (outros filtros são pós-filtro)
        const shouldFetchPhotos = document.querySelector('.filter-chip[data-filter="hasImage"]')?.classList.contains('active') || false;

        // Os filtros (website, telefone, rating) funcionam como pós-filtro - mesmo custo que sem filtros
        // A API do Google não suporta filtragem direta por esses campos
        const results = await placesService.searchPlaces(
            query,
            coordinates,
            radius,
            maxResults,
            shouldFetchPhotos
        );

        console.log(`Resultados obtidos: ${results.length}`);
        
        // Atualizar mapa
        if (mapService) {
            mapService.clearMarkers();
            mapService.addMarkers(results);
        }
        
        // Processar e exibir resultados
        await processarResultadosBusca(results);

        // Salvar sessão no histórico
        if (window.SearchHistoryService && results && results.length > 0) {
            window.SearchHistoryService.saveSession(
                { termo: query, localizacao: location, maxResults },
                results
            );
        }
        
        // Atualizar loading
        if (loadingBar) {
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingBar.style.width = '0%';
            }, 500);
        }
        
    } catch (error) {
        console.error('Erro na busca:', error);
        showError('Erro ao realizar a busca: ' + error.message);
        const loadingBar = document.querySelector('.loading-bar');
        if (loadingBar) loadingBar.style.width = '0%';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorTitle = document.getElementById('errorTitle');
    const errorDetails = document.getElementById('errorDetails');
    
    if (errorContainer && errorTitle && errorDetails) {
        errorTitle.textContent = 'Erro';
        errorDetails.textContent = message;
        errorContainer.classList.remove('hidden');
        
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }
}

function showInfo(message) {
    // Toast informativo simples
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm max-w-md text-center';
    const icon = document.createElement('span');
    icon.className = 'material-icons flex-shrink-0';
    icon.style.fontSize = '18px';
    icon.textContent = 'info';
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(icon, text);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Função para obter coordenadas de um endereço
async function obterCoordenadas(location) {
    return new Promise((resolve, reject) => {
        // Primeiro verifica se já é uma coordenada
        const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            resolve({
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2])
            });
            return;
        }
        
        // Verificar se temos um lugar selecionado do autocomplete
        if (
            window.lastSelectedPlace &&
            window.lastSelectedPlace.location &&
            normalizeLocationText(window.lastSelectedPlaceText) === normalizeLocationText(location)
        ) {
            const selectedLocation = window.lastSelectedPlace.location;
            resolve({
                lat: typeof selectedLocation.lat === 'function' ? selectedLocation.lat() : selectedLocation.lat,
                lng: typeof selectedLocation.lng === 'function' ? selectedLocation.lng() : selectedLocation.lng
            });
            return;
        }
        
        // Se não tiver um lugar do autocomplete, usar o geocoding
        if (!geocoder) {
            reject(new Error('Serviço de geocoding não inicializado'));
            return;
        }

        geocoder.geocode({ address: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng()
                });
            } else {
                reject(new Error('Não foi possível encontrar a localização: ' + status));
            }
        });
    });
}

// Função para definir a visualização (lista ou grid)
function setView(viewType) {
    // Salvar a preferência do usuário
    currentView = viewType;
    StorageManager.writeStoredValue('preferredView', viewType);
    syncLegacyAppState();
    
    // Atualizar botões
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (listViewBtn && gridViewBtn) {
        // Remover classe active de todos os botões
        listViewBtn.classList.remove('active');
        gridViewBtn.classList.remove('active');
        
        // Adicionar classe active apenas ao botão selecionado
        if (viewType === 'list') {
            listViewBtn.classList.add('active');
        } else {
            gridViewBtn.classList.add('active');
        }
    }
    
    // Atualizar visualização
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    
    if (listView && gridView) {
        // Esconder ambas as visualizações primeiro
        listView.classList.add('hidden');
        gridView.classList.add('hidden');
        
        // Mostrar apenas a visualização selecionada
        if (viewType === 'list') {
            listView.classList.remove('hidden');
        } else {
            gridView.classList.remove('hidden');
        }
    }

    if (allResults.length > 0) {
        exibirResultados(allResults);
    }
    
    // Reexibir resultados na nova visualização
    if (allResults.length > 0) {
        applyFilters();
    }
}

// Função para aplicar filtros aos resultados
function applyFilters() {
    syncLegacyAppState();

    if (!allResults || allResults.length === 0) {
        exibirResultados([]);
        document.getElementById('resultCount').textContent = '0 resultados';
        return;
    }

    let filteredResults = [...allResults];
    const hideProspectedBtn = document.getElementById('hideProspectedBtn');
    const hidingProspected = hideProspectedBtn && hideProspectedBtn.classList.contains('active');

    // Filtrar resultados prospectados
    if (hidingProspected) {
        filteredResults = filteredResults.filter(r => !prospectedPlaces.has(r.placeId));
    }

    // Aplicar filtros ativos
    const activeFilters = [];
    document.querySelectorAll('.filter-chip.active').forEach(chip => {
        activeFilters.push({
            filter: chip.dataset.filter,
            value: chip.dataset.value
        });
    });

    // Aplicar filtros em lote para melhor performance
    filteredResults = filteredResults.filter(result => {
        return activeFilters.every(({filter, value}) => {
            switch (filter) {
                case 'rating':
                    if (result.avaliacao === 'Não avaliado') return false;
                    return parseFloat(result.avaliacao) >= parseFloat(value);
                case 'hasWebsite':
                    return result.website && result.website !== 'Não disponível';
                case 'noWebsite':
                    return !result.website || result.website === 'Não disponível';
                case 'hasPhone':
                    return result.telefone && result.telefone !== 'Não disponível';
                case 'manyReviews':
                    if (!result.totalAvaliacoes || result.totalAvaliacoes === 'N/A') return false;
                    const reviews = parseInt(result.totalAvaliacoes.replace(/,/g, ''));
                    return reviews >= parseInt(value);
                case 'hasImage':
                    return !!result.hasPhoto;
                default:
                    return true;
            }
        });
    });

    // Exibir resultados filtrados
    exibirResultados(filteredResults);
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = `${filteredResults.length} resultado${filteredResults.length !== 1 ? 's' : ''}`;
    }
}

// Função para processar os resultados da busca
async function processarResultadosBusca(results) {
    console.log('Processando resultados:', results);

    if (!results || results.length === 0) {
        allResults = [];
        syncLegacyAppState();
        document.getElementById('resultCount').textContent = '0 resultados';
        exibirResultados([]);
        return;
    }

    // Atualizar resultados globais
    allResults = results;
    syncLegacyAppState();

    // Atualizar a interface
    atualizarProgresso(results.length, document.getElementById('maxResults').value);
    document.getElementById('resultCount').textContent = `${results.length} resultados`;
    
    // Aplicar filtros e exibir resultados
    applyFilters();

    // Calcular scores de lead para cada resultado (se LeadScoreService existir)
    if (window.LeadScoreService && results && results.length > 0) {
        const searchTerm = document.getElementById('searchTerm')?.value.trim() || '';
        
        results.forEach(company => {
            if (company.placeId) {
                // Converter formato da empresa para o formato esperado pelo LeadScoreService
                const leadData = {
                    rating: company.avaliacao,
                    totalAvaliacoes: company.totalAvaliacoes,
                    website: company.website,
                    telefone: company.telefone,
                    hasPhoto: company.hasPhoto || !!company.foto,
                    endereco: company.endereco
                };
                
                // Calcular e salvar o score
                window.LeadScoreService.updateScore(company.placeId, leadData, searchTerm);
            }
        });
        
        console.log(`Scores calculados para ${results.length} empresas`);
    }
}

// Função para exportar para CSV
function exportarCSV() {
    if (!allResults || allResults.length === 0) {
        showError('Não há resultados para exportar');
        return;
    }

    const headers = [
        'Nome',
        'Endereço',
        'Telefone',
        'Website',
        'Avaliação',
        'Total de Avaliações',
        'Status',
        'Google Places ID',
        'Latitude',
        'Longitude'
    ];

    const rows = allResults.map(result => [
        `"${result.nome.replace(/"/g, '""')}"`,
        `"${result.endereco.replace(/"/g, '""')}"`,
        `"${result.telefone.replace(/"/g, '""')}"`,
        `"${result.website.replace(/"/g, '""')}"`,
        `"${result.avaliacao}"`,
        `"${result.totalAvaliacoes}"`,
        `"${prospectedPlaces.has(result.placeId) ? 'Prospectado' : 'Não Prospectado'}"`,
        `"${result.placeId}"`,
        `"${result.localizacao?.lat || ''}"`,
        `"${result.localizacao?.lng || ''}"`,
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Adicionar BOM para UTF-8
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Função para exportar para PDF
function exportarPDF() {
    if (!allResults || allResults.length === 0) {
        showError('Não há resultados para exportar');
        return;
    }

    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Empresas</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .result { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc; }
                .result-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                .result-info { margin: 3px 0; color: #666; }
                .prospected { color: #10B981; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Empresas</h1>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Total de resultados: ${allResults.length}</p>
            </div>
            ${allResults.map(result => {
                const safeName = escapeHtml(result.nome || 'Não disponível');
                const safeAddress = escapeHtml(result.endereco || 'Não disponível');
                const safePhone = escapeHtml(result.telefone || 'Não disponível');
                const safeWebsite = escapeHtml(result.website || 'Não disponível');
                const safeRating = escapeHtml(result.avaliacao || 'Não disponível');
                const safeReviews = escapeHtml(result.totalAvaliacoes || 0);
                const isProspected = prospectedPlaces.has(result.placeId);

                return `
                <div class="result">
                    <div class="result-title">${safeName}</div>
                    <div class="result-info">Endereço: ${safeAddress}</div>
                    <div class="result-info">Telefone: ${safePhone}</div>
                    <div class="result-info">Website: ${safeWebsite}</div>
                    <div class="result-info">Avaliação: ${safeRating} (${safeReviews} avaliações)</div>
                    <div class="result-info ${isProspected ? 'prospected' : ''}">
                        Status: ${isProspected ? 'Prospectado' : 'Não Prospectado'}
                    </div>
                </div>
            `;
            }).join('')}
        </body>
        </html>
    `;

    // Criar um Blob com o conteúdo HTML
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Abrir em nova aba para impressão
    const win = window.open(url, '_blank');
    if (win) {
        win.onload = () => {
            win.print();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
    } else {
        showError('Por favor, permita popups para gerar o PDF');
        URL.revokeObjectURL(url);
    }
}

// Funções de exibição e atualização
function atualizarProgresso(current, total) {
    const progress = Math.min(100, Math.round((current / total) * 100));
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${progress}% concluído`;
}

function exibirResultados(results) {
    console.log('Exibindo resultados:', results);
    
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    
    if (!listView || !gridView) {
        console.error('Elementos de visualização não encontrados');
        return;
    }
    
    // Limpar completamente ambos os containers
    listView.replaceChildren();
    gridView.replaceChildren();
    
    // Garantir que a visualização correta esteja visível
    listView.classList.add('hidden');
    gridView.classList.add('hidden');
    
    if (currentView === 'list') {
        listView.classList.remove('hidden');
    } else {
        gridView.classList.remove('hidden');
    }
    
    if (!results || results.length === 0) {
        const emptyState = createEmptyState('Realize uma pesquisa para exibir os resultados');
        
        // Adicionar estado vazio apenas na visualização ativa
        if (currentView === 'list') {
            listView.replaceChildren(emptyState);
        } else {
            gridView.replaceChildren(emptyState);
        }
        return;
    }
    
    // Exibir resultados apenas na visualização ativa
    if (currentView === 'list') {
        exibirResultadosLista(results);
    } else {
        exibirResultadosGrid(results);
    }
    
    // Mostrar botão de download
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
    }
}

function exibirResultadosLista(results) {
    const listView = document.getElementById('listView');
    listView.replaceChildren();
    listView.className = 'list-view divide-y divide-gray-700';
    
    if (results.length === 0) {
        listView.replaceChildren(createEmptyState('Tente ajustar seus critérios de pesquisa'));
        return;
    }

    const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
    let currentPage = getPaginationPage('list');
    if (currentPage > totalPages) {
        currentPage = 1;
        setPaginationPage('list', currentPage);
    }

    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const pageResults = results.slice(startIndex, startIndex + RESULTS_PER_PAGE);
    
    pageResults.forEach((result, index) => {
        listView.appendChild(createResultListItem(result, startIndex + index));
    });

    renderPaginationControls(listView, totalPages, currentPage, page => {
        setPaginationPage('list', page);
        exibirResultadosLista(results);
    });
    
    // Adicionar eventos
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            mostrarDetalhes(results[index]);
        });
    });

    // Adicionar eventos para os badges de prospecção
    document.querySelectorAll('.prospected-badge').forEach(badge => {
        badge.addEventListener('click', function() {
            const placeId = this.dataset.placeId;
            if (placeId) {
                toggleProspectedStatus(this);
            }
        });
    });
}

function exibirResultadosGrid(results) {
    const gridView = document.getElementById('gridView');
    gridView.replaceChildren();
    gridView.className = 'grid-view grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4';
    
    if (results.length === 0) {
        const emptyState = createEmptyState('Tente ajustar seus critérios de pesquisa');
        emptyState.className = 'col-span-full empty-state';
        gridView.appendChild(emptyState);
        return;
    }

    const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
    let currentPage = getPaginationPage('grid');
    if (currentPage > totalPages) {
        currentPage = 1;
        setPaginationPage('grid', currentPage);
    }

    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const pageResults = results.slice(startIndex, startIndex + RESULTS_PER_PAGE);
    
    pageResults.forEach((result, index) => {
        gridView.appendChild(createResultGridCard(result, startIndex + index));
    });

    renderPaginationControls(gridView, totalPages, currentPage, page => {
        setPaginationPage('grid', page);
        exibirResultadosGrid(results);
    });
    
    // Adicionar eventos
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            mostrarDetalhes(results[index]);
        });
    });

    // Adicionar eventos para os badges de prospecção
    document.querySelectorAll('.prospected-badge').forEach(badge => {
        badge.addEventListener('click', function() {
            const placeId = this.dataset.placeId;
            if (placeId) {
                toggleProspectedStatus(this);
            }
        });
    });
}

function toggleProspectedStatusFromModal(badge, placeId) {
    if (!placeId) {
        console.error('ID do local não fornecido');
        return;
    }

    const isProspected = badge.classList.contains('prospected');
    
    if (isProspected) {
        // Remover da lista de prospectados
        window.prospectedPlaces.delete(placeId);
        badge.classList.remove('prospected');
        const span = badge.querySelector('span');
        if (span) span.textContent = 'Não Prospectado';
    } else {
        // Adicionar à lista de prospectados
        window.prospectedPlaces.add(placeId);
        badge.classList.add('prospected');
        const span = badge.querySelector('span');
        if (span) span.textContent = 'Prospectado';
    }
    
    // Salvar no localStorage
    StorageManager.writeStoredSet('prospectedPlaces', window.prospectedPlaces);
    syncLegacyAppState();
    
    // Disparar evento personalizado para notificar outras partes do sistema
    const event = new CustomEvent('prospectedStatusChanged', {
        detail: { placeId, isProspected: !isProspected }
    });
    document.dispatchEvent(event);
}

function toggleProspectedStatus(badge) {
    const placeId = badge.getAttribute('data-place-id');
    if (!placeId) return;
    
    toggleProspectedStatusFromModal(badge, placeId);
}

// Ouvir eventos de mudança de status de prospectado
document.addEventListener('prospectedStatusChanged', function(e) {
    const { placeId, isProspected } = e.detail;
    
    // Atualizar todos os badges com o mesmo placeId
    document.querySelectorAll(`.prospected-badge[data-place-id="${placeId}"]`).forEach(badge => {
        badge.classList.toggle('prospected', isProspected);
        const span = badge.querySelector('span');
        if (span) {
            span.textContent = isProspected ? 'Prospectado' : 'Não Prospectado';
        }
        
        // Atualizar a classe do item pai para destacar visualmente
        // Para itens da lista
        const listItem = badge.closest('.result-item');
        if (listItem) {
            listItem.classList.toggle('prospected-item', isProspected);
        }
        
        // Para cards da grade
        const gridCard = badge.closest('.grid-card');
        if (gridCard) {
            gridCard.classList.toggle('prospected-item', isProspected);
        }
    });
});

// Função global necessária para o callback da API do Google Maps
window.initMap = function() {
    if (mapService) {
        mapService.initializeMap();
    }
};

function exibirMapa(center) {
    const mapContainer = document.getElementById('mapContainer');
    const mapElement = document.getElementById('map');
    
    if (!mapContainer || !mapElement) {
        console.error('Elementos do mapa não encontrados');
        return;
    }

    mapContainer.classList.remove('hidden');
    
    try {
        if (!mapService) {
            mapService = new MapService();
        }
        
        // Inicializar o mapa se ainda não foi inicializado
        if (!mapService.map) {
            mapService.initializeMap().then(() => {
                mapService.map.setCenter(center);
                mapService.map.setZoom(12);
                mapService.clearMarkers();
                // Adicionar marcador central
                mapService.addMarker(center, 'Localização central', true);
            });
        } else {
            mapService.map.setCenter(center);
            mapService.map.setZoom(12);
            mapService.clearMarkers();
            // Adicionar marcador central
            mapService.addMarker(center, 'Localização central', true);
        }
    } catch (error) {
        console.error('Erro ao exibir mapa:', error);
        showError('Erro ao exibir o mapa: ' + error.message);
    }
}

// Função para mostrar detalhes de um resultado em um modal
function mostrarDetalhes(result) {
    if (window.LeadModal && typeof window.LeadModal.open === 'function') {
        window.LeadModal.open(result, {
            source: 'radar-modal',
            onChange: () => {
                applyFilters();
            }
        });
        return;
    }

    console.log('Abrindo modal para:', result); // Debug

    const detailsModal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    if (!detailsModal || !modalContent || !modalTitle) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    // Definir o título do modal
    modalTitle.textContent = result.nome;

    // Carregar dados do lead
    if (!window.leadManager) {
        console.error('LeadManager não inicializado');
        window.leadManager = new LeadManager();
    }
    
    // Garantir que o lead exista no sistema antes de tentar adicionar notas
    if (!window.leadManager.getLead(result.placeId)) {
        console.log('Criando novo lead:', result.placeId);
        window.leadManager.saveLead(result.placeId, {
            nome: result.nome,
            endereco: result.endereco,
            telefone: result.telefone,
            categoria: result.categoria,
            notes: []
        });
    }
    
    const leadData = window.leadManager.getLead(result.placeId) || {};
    console.log('Dados do lead:', leadData); // Debug

    // Preencher o conteúdo do modal
    const modalWrapper = document.createElement('div');
    modalWrapper.className = 'space-y-4';

    if (result.foto) {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'w-full h-64 rounded-lg overflow-hidden mb-4';

        const photo = document.createElement('img');
        photo.src = safeUrl(result.foto);
        photo.alt = escapeHtml(result.nome);
        photo.className = 'w-full h-full object-cover';

        photoWrapper.appendChild(photo);
        modalWrapper.appendChild(photoWrapper);
    }

    if (result.avaliacao !== 'Não avaliado') {
        const ratingWrapper = document.createElement('div');
        ratingWrapper.className = 'flex items-center mb-4';

        const ratingValue = document.createElement('span');
        ratingValue.className = 'text-yellow-300 font-medium mr-1';
        ratingValue.textContent = escapeHtml(result.avaliacao);

        const ratingIcon = document.createElement('i');
        ratingIcon.className = 'fas fa-star text-yellow-300 text-sm';

        const ratingCount = document.createElement('span');
        ratingCount.className = 'text-gray-400 text-sm ml-2';
        ratingCount.textContent = `(${escapeHtml(result.totalAvaliacoes)} avaliações)`;

        ratingWrapper.append(ratingValue, ratingIcon, ratingCount);
        modalWrapper.appendChild(ratingWrapper);
    }

    const addressSection = document.createElement('div');
    const addressLabel = document.createElement('h3');
    addressLabel.className = 'text-gray-400 text-sm mb-1';
    addressLabel.textContent = 'ENDEREÇO';
    const addressValue = document.createElement('p');
    addressValue.className = 'text-white';
    addressValue.textContent = escapeHtml(result.endereco);
    addressSection.append(addressLabel, addressValue);
    modalWrapper.appendChild(addressSection);

    const phoneSection = document.createElement('div');
    const phoneLabel = document.createElement('h3');
    phoneLabel.className = 'text-gray-400 text-sm mb-1';
    phoneLabel.textContent = 'TELEFONE';
    const phoneValue = document.createElement('p');
    phoneValue.className = 'text-white';
    phoneValue.textContent = escapeHtml(result.telefone);
    phoneSection.append(phoneLabel, phoneValue);
    modalWrapper.appendChild(phoneSection);

    const websiteSection = document.createElement('div');
    const websiteLabel = document.createElement('h3');
    websiteLabel.className = 'text-gray-400 text-sm mb-1';
    websiteLabel.textContent = 'WEBSITE';
    websiteSection.appendChild(websiteLabel);

    if (result.website !== 'Não disponível') {
        const websiteLink = document.createElement('a');
        websiteLink.href = safeUrl(result.website);
        websiteLink.target = '_blank';
        websiteLink.rel = 'noopener noreferrer';
        websiteLink.className = 'text-accent hover:underline flex items-center';
        websiteLink.textContent = escapeHtml(result.website);

        const websiteIcon = document.createElement('i');
        websiteIcon.className = 'fas fa-external-link-alt ml-1 text-xs';
        websiteLink.appendChild(websiteIcon);
        websiteSection.appendChild(websiteLink);
    } else {
        const websiteValue = document.createElement('p');
        websiteValue.className = 'text-gray-400';
        websiteValue.textContent = 'Não disponível';
        websiteSection.appendChild(websiteValue);
    }

    modalWrapper.appendChild(websiteSection);

    const statusSection = document.createElement('div');
    const statusLabel = document.createElement('h3');
    statusLabel.className = 'text-gray-400 text-sm mb-1';
    statusLabel.textContent = 'STATUS';

    const statusBadge = document.createElement('div');
    statusBadge.className = `prospected-badge ${window.prospectedPlaces.has(result.placeId) ? 'prospected' : ''}`;
    statusBadge.dataset.placeId = String(result.placeId || '');

    const statusIcon = document.createElement('i');
    statusIcon.className = 'fas fa-check-circle';

    const statusText = document.createElement('span');
    statusText.textContent = window.prospectedPlaces.has(result.placeId) ? 'Prospectado' : 'Não Prospectado';

    statusBadge.append(statusIcon, statusText);
    statusSection.append(statusLabel, statusBadge);
    modalWrapper.appendChild(statusSection);

    modalContent.replaceChildren(modalWrapper);

    // Mostrar o modal
    detailsModal.classList.remove('hidden');

    // Configurar badge de prospecção
    const prospectedBadge = modalContent.querySelector('.prospected-badge');
    if (prospectedBadge) {
        prospectedBadge.style.cursor = 'pointer';
        prospectedBadge.addEventListener('click', function(e) {
            e.stopPropagation(); // Impedir que o evento seja capturado por elementos pais
            
            const placeId = this.getAttribute('data-place-id');
            if (!placeId) return;
            
            const isProspected = window.prospectedPlaces.has(placeId);
            const newIsProspected = !isProspected;
            
            // Atualizar o estado global
            if (isProspected) {
                window.prospectedPlaces.delete(placeId);
            } else {
                window.prospectedPlaces.add(placeId);
            }
            
            // Atualizar a aparência do botão
            this.classList.toggle('prospected', newIsProspected);
            const span = this.querySelector('span');
            if (span) {
                span.textContent = newIsProspected ? 'Prospectado' : 'Não Prospectado';
            }
            
            // Salvar no localStorage
            StorageManager.writeStoredSet('prospectedPlaces', window.prospectedPlaces);
            
            // Disparar evento para atualizar todas as visualizações
            const event = new CustomEvent('prospectedStatusChanged', {
                detail: { placeId, isProspected: newIsProspected }
            });
            document.dispatchEvent(event);
            
            // Forçar atualização da exibição
            applyFilters();
        }, true); // Usar capture para garantir que o evento seja capturado
    }

    // Configurar botões de status
    const statusButtons = detailsModal.querySelectorAll('.lead-status-btn');
    const leadStatusSummary = document.getElementById('leadStatusSummary');
    const statusLabels = {
        quente: 'Quente',
        morno: 'Morno',
        frio: 'Frio'
    };

    function syncLeadStatusSelection(selectedStatus) {
        statusButtons.forEach(button => {
            const isActive = button.dataset.status === selectedStatus;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        if (leadStatusSummary) {
            if (selectedStatus && statusLabels[selectedStatus]) {
                leadStatusSummary.textContent = `Status atual: ${statusLabels[selectedStatus]}.`;
                leadStatusSummary.className = 'mt-3 text-xs font-medium text-accent';
            } else {
                leadStatusSummary.textContent = 'Nenhum status selecionado.';
                leadStatusSummary.className = 'mt-3 text-xs text-gray-400';
            }
        }
    }

    syncLeadStatusSelection(leadData.status || null);

    statusButtons.forEach(btn => {
        const status = btn.dataset.status;
        
        btn.addEventListener('click', () => {
            window.leadManager.updateLeadStatus(result.placeId, status);
            leadData.status = status;
            syncLeadStatusSelection(status);
        });
    });

    // Configurar adição de notas
    const noteInput = document.getElementById('noteInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notesList = document.getElementById('notesList');

    if (noteInput && addNoteBtn && notesList) {
        function renderNotes() {
            const lead = window.leadManager.getLead(result.placeId);
            if (!lead || !lead.notes || lead.notes.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'text-sm text-gray-500';
                empty.textContent = 'Nenhuma nota ainda.';
                notesList.replaceChildren(empty);
                return;
            }

            const noteElements = lead.notes.map(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item group';

                const header = document.createElement('div');
                header.className = 'flex justify-between items-start';

                const noteText = document.createElement('p');
                noteText.className = 'text-sm text-white';
                noteText.textContent = note.text || '';

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-note-btn opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity';
                deleteButton.dataset.noteId = String(note.id);

                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fas fa-times';
                deleteButton.appendChild(deleteIcon);

                header.append(noteText, deleteButton);

                const noteDate = document.createElement('span');
                noteDate.className = 'note-date';
                noteDate.textContent = new Date(note.date).toLocaleString();

                noteItem.append(header, noteDate);
                return noteItem;
            });

            notesList.replaceChildren(...noteElements);

            // Adicionar eventos para deletar notas
            document.querySelectorAll('.delete-note-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const noteId = parseInt(btn.dataset.noteId);
                    // Adicionar confirmau00e7u00e3o antes de excluir a nota
                    const confirmDelete = confirm('Tem certeza que deseja excluir esta nota?');
                    if (confirmDelete && window.leadManager.deleteNote(result.placeId, noteId)) {
                        renderNotes();
                    }
                });
            });
        }

        // Limpar eventos anteriores e garantir que o botão funcione corretamente
        const newAddNoteBtn = addNoteBtn.cloneNode(true);
        addNoteBtn.parentNode.replaceChild(newAddNoteBtn, addNoteBtn);

        newAddNoteBtn.addEventListener('click', function() {
            const noteText = noteInput.value.trim();
            
            if (noteText) {
                const noteAdded = window.leadManager.addNote(result.placeId, noteText);
                if (noteAdded) {
                    noteInput.value = '';
                    renderNotes();
                    showInfo('Nota salva no lead.');
                }
            }
        });
        
        // Adicionar evento de tecla Enter no campo de texto
        noteInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                newAddNoteBtn.click();
            }
        });

        // Renderizar notas existentes
        renderNotes();
    }

    // Configurar quick actions
    const whatsappBtn = document.getElementById('whatsappBtn');
    const copyInfoBtn = document.getElementById('copyInfoBtn');
    const emailBtn = document.getElementById('emailBtn');

    if (whatsappBtn && copyInfoBtn && emailBtn) {
        // Limpar eventos anteriores
        const newWhatsappBtn = whatsappBtn.cloneNode(true);
        const newCopyInfoBtn = copyInfoBtn.cloneNode(true);
        const newEmailBtn = emailBtn.cloneNode(true);

        whatsappBtn.parentNode.replaceChild(newWhatsappBtn, whatsappBtn);
        copyInfoBtn.parentNode.replaceChild(newCopyInfoBtn, copyInfoBtn);
        emailBtn.parentNode.replaceChild(newEmailBtn, emailBtn);

        newWhatsappBtn.addEventListener('click', () => {
            const phone = result.telefone.replace(/\D/g, '');
            if (phone) {
                const safeBusinessName = escapeHtml(result.nome);
                const message = encodeURIComponent(`Olá! Vi seu negócio ${safeBusinessName} e gostaria de apresentar nossa solução...`);
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            }
        });

        newCopyInfoBtn.addEventListener('click', () => {
            const info = `
${escapeHtml(result.nome)}
${escapeHtml(result.endereco)}
${escapeHtml(result.telefone)}
${escapeHtml(result.website)}
            `.trim();
            navigator.clipboard.writeText(info).then(() => {
                showInfo('Informações copiadas para a área de transferência');
            });
        });

        newEmailBtn.addEventListener('click', () => {
            const safeBusinessName = escapeHtml(result.nome);
            const subject = encodeURIComponent(`Proposta para ${safeBusinessName}`);
            const body = encodeURIComponent(`Prezado(a) responsável pelo ${safeBusinessName},\n\n`);
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        });
    }

    // Configurar o botão de fechar
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        // Remover eventos anteriores
        const newCloseBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
        
        // Adicionar novo evento
        newCloseBtn.addEventListener('click', () => {
            detailsModal.classList.add('hidden');
        });
    }

    // Fechar modal ao clicar fora
    const handleOutsideClick = (e) => {
        if (e.target === detailsModal) {
            detailsModal.classList.add('hidden');
            detailsModal.removeEventListener('click', handleOutsideClick);
        }
    };
    
    detailsModal.addEventListener('click', handleOutsideClick);
}

// Inicializar quando o DOM estiver pronto
installLegacyRuntimeBridge();
document.addEventListener('DOMContentLoaded', initializeApp);
