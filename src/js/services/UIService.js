/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

class UIService {
    constructor() {
        this.initializeEventListeners();
        this.currentView = 'list'; // ou 'grid'
    }

    initializeEventListeners() {
        // Botões de visualização
        document.querySelector('#listViewBtn')?.addEventListener('click', () => this.switchView('list'));
        document.querySelector('#gridViewBtn')?.addEventListener('click', () => this.switchView('grid'));

        // Botão de ocultar prospectados
        document.querySelector('#hideProspectedBtn')?.addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            this.toggleProspectedItems();
        });

        // Inicializar eventos dos modais
        this.initializeModalEvents();

        // Botões de filtro
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const filter = chip.dataset.filter;
                const value = chip.dataset.value;

                // Alternar classe active
                chip.classList.toggle('active');
                const isActive = chip.classList.contains('active');

                // Sincronizar com appState.activeFilters
                if (window.appState && window.appState.activeFilters) {
                    if (isActive) {
                        window.appState.activeFilters[filter] = value || true;
                    } else {
                        delete window.appState.activeFilters[filter];
                    }
                }

                // Se for um filtro que precisa de re-filtro após extração (hasWebsite, noWebsite, hasPhone, rating, manyReviews)
                const needsReapply = ['hasWebsite', 'noWebsite', 'hasPhone', 'rating', 'manyReviews', 'hasImage'].includes(filter);
                if (needsReapply && typeof window.applySearchFilters === 'function') {
                    window.applySearchFilters();
                } else {
                    this.applyFilters();
                }
            });
        });
    }

    initializeModalEvents() {
        // Modal API Key
        const apiKeyModal = document.getElementById('apiKeyModal');
        const apiKeyBtn = document.getElementById('apiKeyBtn');
        const closeApiKeyModalBtn = document.getElementById('closeApiKeyModalBtn');
        const validateKeyBtn = document.getElementById('validateKeyBtn');
        const clearKeyBtn = document.getElementById('clearKeyBtn');
        const apiKeyInput = document.getElementById('apiKey');

        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', () => this.openModal('apiKeyModal'));
        }

        if (closeApiKeyModalBtn) {
            closeApiKeyModalBtn.addEventListener('click', () => this.closeModal('apiKeyModal'));
        }

        if (validateKeyBtn) {
            validateKeyBtn.addEventListener('click', async () => {
                await this.validateApiKey();
            });
        }

        if (clearKeyBtn) {
            clearKeyBtn.addEventListener('click', () => this.clearApiKey());
        }

        if (apiKeyInput) {
            apiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    validateKeyBtn?.click();
                }
            });
        }

        // Modal de Detalhes
        const detailsModal = document.getElementById('detailsModal');
        const closeDetailsModalBtn = document.getElementById('closeModalBtn');

        if (closeDetailsModalBtn) {
            closeDetailsModalBtn.addEventListener('click', () => this.closeModal('detailsModal'));
        }

        // Modal de Download
        const downloadModal = document.getElementById('downloadModal');
        const closeDownloadModalBtn = document.getElementById('closeDownloadModalBtn');

        if (closeDownloadModalBtn) {
            closeDownloadModalBtn.addEventListener('click', () => this.closeModal('downloadModal'));
        }

        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');

            if (modalId === 'apiKeyModal') {
                const validateKeyBtn = document.getElementById('validateKeyBtn');
                if (validateKeyBtn) {
                    validateKeyBtn.replaceChildren(ApiKeyService.hasStoredApiKey() ? 'Atualizar' : 'Validar');
                }
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async validateApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const validateKeyBtn = document.getElementById('validateKeyBtn');
        const validationResult = document.getElementById('keyValidationResult');
        const validationIcon = document.getElementById('validationIcon');
        const validationMessage = document.getElementById('validationMessage');
        const apiKeyBtn = document.getElementById('apiKeyBtn');

        const apiKey = apiKeyInput?.value.trim();

        if (!apiKey) {
            this.showValidationError('Por favor, digite sua chave API');
            return;
        }

        if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
            this.showValidationError('Formato de chave API inválido (deve começar com AIza)');
            return;
        }

        try {
            validateKeyBtn.disabled = true;
            validateKeyBtn.replaceChildren();
            const spinnerIcon = document.createElement('i');
            spinnerIcon.className = 'fas fa-spinner fa-spin mr-2';
            validateKeyBtn.append(spinnerIcon, 'Validando...');

            let pin = ApiKeyService.getSessionPin();
            if (!pin) {
                pin = await requestMaskedPin({
                    title: 'Atualizar chave API',
                    description: 'Digite a senha da instalação para atualizar a chave API com segurança.',
                    label: 'Senha da instalação',
                    validate: value => StorageManager.validateInstallationPin(value)
                });
            }
            if (!pin) {
                throw new Error('Senha da instalação obrigatória para salvar a chave API com segurança');
            }

            await ApiKeyService.validateAndSaveApiKey(apiKey, pin);

            // Atualizar UI
            apiKeyInput.classList.add('api-key-valid');
            apiKeyInput.classList.remove('api-key-invalid');
            apiKeyBtn.classList.add('api-key-validated');
            apiKeyBtn.replaceChildren();
            const verifiedIcon = document.createElement('span');
            verifiedIcon.className = 'material-icons mr-1';
            verifiedIcon.textContent = 'verified';
            const verifiedLabel = document.createElement('span');
            verifiedLabel.className = 'text-sm';
            verifiedLabel.textContent = 'API Verificada';
            apiKeyBtn.append(verifiedIcon, verifiedLabel);

            validationResult.classList.remove('hidden');
            validationIcon.className = 'fas fa-check-circle text-green-500 mr-2';
            validationMessage.textContent = 'Chave API salva com sucesso';

            // Fechar o modal e recarregar a página
            setTimeout(() => {
                this.closeModal('apiKeyModal');
                window.location.reload(); // Recarregar a página para aplicar as alterações
            }, 1000);

        } catch (error) {
            console.error('Erro ao validar chave API:', error);
            this.showValidationError(error.message || 'Erro ao validar a chave API. Verifique o console para mais detalhes.');
            apiKeyInput.classList.add('api-key-invalid');
            apiKeyInput.classList.remove('api-key-valid');
        } finally {
            validateKeyBtn.disabled = false;
            validateKeyBtn.replaceChildren(ApiKeyService.hasStoredApiKey() ? 'Atualizar' : 'Validar');
        }
    }

    showValidationError(message) {
        const validationResult = document.getElementById('keyValidationResult');
        const validationIcon = document.getElementById('validationIcon');
        const validationMessage = document.getElementById('validationMessage');

        validationResult.classList.remove('hidden');
        validationIcon.className = 'fas fa-times-circle text-red-500 mr-2';
        validationMessage.textContent = message;
    }

    clearApiKey() {
        ApiKeyService.clearApiKey();
        const apiKeyInput = document.getElementById('apiKey');
        const validationResult = document.getElementById('keyValidationResult');
        const apiKeyBtn = document.getElementById('apiKeyBtn');

        if (apiKeyInput) {
            apiKeyInput.value = '';
            apiKeyInput.classList.remove('api-key-valid', 'api-key-invalid');
        }

        if (validationResult) {
            validationResult.classList.add('hidden');
        }

        if (apiKeyBtn) {
            apiKeyBtn.classList.remove('api-key-validated');
            apiKeyBtn.replaceChildren();
            const keyIcon = document.createElement('span');
            keyIcon.className = 'material-icons mr-2';
            keyIcon.textContent = 'vpn_key';
            const keyLabel = document.createElement('span');
            keyLabel.textContent = 'Chave API';
            apiKeyBtn.append(keyIcon, keyLabel);
        }

        location.href = location.href; // Recarregar a página de forma segura
    }

    switchView(view) {
        const listView = document.querySelector('.list-view');
        const gridView = document.querySelector('.grid-view');
        const listBtn = document.querySelector('#listViewBtn');
        const gridBtn = document.querySelector('#gridViewBtn');

        if (view === 'list') {
            listView?.classList.remove('hidden');
            gridView?.classList.add('hidden');
            listBtn?.classList.add('active');
            gridBtn?.classList.remove('active');
        } else {
            gridView?.classList.remove('hidden');
            listView?.classList.add('hidden');
            gridBtn?.classList.add('active');
            listBtn?.classList.remove('active');
        }

        this.currentView = view;
    }

    toggleProspectedItems() {
        const hideProspected = document.querySelector('#hideProspectedBtn')?.classList.contains('active');
        const items = document.querySelectorAll('.result-item, .grid-card');

        items.forEach(item => {
            if (item.classList.contains('prospected-item')) {
                item.style.display = hideProspected ? 'none' : '';
            }
        });
    }

    applyFilters() {
        const activeFilters = Array.from(document.querySelectorAll('.filter-chip.active'))
            .map(chip => chip.dataset.filter);

        const items = document.querySelectorAll('.result-item, .grid-card');
        
        items.forEach(item => {
            const itemTypes = item.dataset.types?.split(',') || [];
            const shouldShow = activeFilters.length === 0 || 
                             activeFilters.some(filter => itemTypes.includes(filter));
            
            item.style.display = shouldShow ? '' : 'none';
        });
    }

    renderResults(results, container) {
        if (!container) return;
        
        const view = this.currentView;
        let html = '';

        if (results.length === 0) {
            html = this.getEmptyStateHTML();
        } else {
            html = results.map(result => 
                view === 'list' ? this.getListItemHTML(result) : this.getGridCardHTML(result)
            ).join('');
        }

        container.innerHTML = html;
        this.initializeResultEventListeners();
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="material-icons empty-state-icon">search_off</i>
                <h3 class="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
                <p class="text-gray-400">Tente ajustar seus critérios de busca</p>
            </div>
        `;
    }

    getListItemHTML(result) {
        return `
            <div class="result-item p-4 bg-gray-800 rounded-lg ${result.prospected ? 'prospected-item' : ''}"
                 data-place-id="${result.placeId}"
                 data-types="${result.tipos.join(',')}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold">${result.nome}</h3>
                        <p class="text-gray-400 mt-1">${result.endereco}</p>
                        <div class="mt-2 flex items-center gap-2">
                            ${this.getRatingHTML(result)}
                            ${this.getContactHTML(result)}
                        </div>
                    </div>
                    ${this.getProspectedBadgeHTML(result)}
                </div>
            </div>
        `;
    }

    getGridCardHTML(result) {
        return `
            <div class="grid-card bg-gray-800 ${result.prospected ? 'prospected-item' : ''}"
                 data-place-id="${result.placeId}"
                 data-types="${result.tipos.join(',')}">
                <div class="grid-card-header">
                    <h3 class="text-lg font-semibold">${result.nome}</h3>
                </div>
                <div class="grid-card-body">
                    <p class="text-gray-400">${result.endereco}</p>
                    <div class="mt-3">
                        ${this.getRatingHTML(result)}
                        ${this.getContactHTML(result)}
                    </div>
                </div>
                <div class="grid-card-footer">
                    ${this.getProspectedBadgeHTML(result)}
                </div>
            </div>
        `;
    }

    getRatingHTML(result) {
        if (result.avaliacao === 'Não avaliado') return '';
        return `
            <div class="flex items-center gap-1">
                <span class="rating-badge bg-yellow-600">${result.avaliacao}</span>
                <span class="text-sm text-gray-400">(${result.totalAvaliacoes})</span>
            </div>
        `;
    }

    getContactHTML(result) {
        return `
            <div class="flex items-center gap-3 mt-2">
                ${result.telefone !== 'Não disponível' ? 
                    `<a href="tel:${result.telefone}" class="text-purple-400 hover:text-purple-300">
                        <i class="fas fa-phone-alt"></i>
                    </a>` : ''}
                ${result.website !== 'Não disponível' ? 
                    `<a href="${result.website}" target="_blank" class="text-purple-400 hover:text-purple-300">
                        <i class="fas fa-globe"></i>
                    </a>` : ''}
            </div>
        `;
    }

    getProspectedBadgeHTML(result) {
        return `
            <div class="prospected-badge ${result.prospected ? 'prospected' : ''}"
                 onclick="toggleProspected('${result.placeId}')">
                <i class="fas ${result.prospected ? 'fa-check' : 'fa-user-plus'}"></i>
                <span>${result.prospected ? 'Prospectado' : 'Prospectar'}</span>
            </div>
        `;
    }

    initializeResultEventListeners() {
        // Adicionar event listeners específicos para os resultados
        document.querySelectorAll('.prospected-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const placeId = badge.closest('[data-place-id]').dataset.placeId;
                this.toggleProspected(placeId);
            });
        });
    }

    toggleProspected(placeId) {
        const items = document.querySelectorAll(`[data-place-id="${placeId}"]`);
        items.forEach(item => {
            item.classList.toggle('prospected-item');
            const badge = item.querySelector('.prospected-badge');
            badge?.classList.toggle('prospected');
            
            const icon = badge?.querySelector('i');
            const text = badge?.querySelector('span');
            
            if (badge?.classList.contains('prospected')) {
                icon.className = 'fas fa-check';
                text.textContent = 'Prospectado';
            } else {
                icon.className = 'fas fa-user-plus';
                text.textContent = 'Prospectar';
            }
        });
    }
} 