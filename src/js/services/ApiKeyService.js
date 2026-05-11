/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Serviço de gerenciamento da chave de API do Google Maps
 * Este serviço gerencia o armazenamento, validação e carregamento da API do Google Maps
 */
class ApiKeyService {
    static KEY_STORAGE_NAME = 'googlePlacesApiKey';
    static SESSION_UNLOCK_KEY = 'googlePlacesApiKeyUnlocked';
    static LOCAL_ACCESS_UNLOCK_KEY = 'buscaEmpresasLocalAccessUnlocked';
    static SESSION_PIN = null;
    static API_LOADED = false;
    static securityService = null;

    static _dispatchApiStateChange() {
        if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') {
            return;
        }

        window.dispatchEvent(new CustomEvent('leadradar:api-state-changed', {
            detail: {
                connected: Boolean(sessionStorage.getItem(this.SESSION_UNLOCK_KEY)),
                hasStoredVault: this.hasStoredApiKey()
            }
        }));
    }

    /**
     * Inicializa o serviço de segurança se necessário
     * @private
     */
    static _initSecurity() {
        if (!this.securityService && typeof SecurityService !== 'undefined') {
            this.securityService = new SecurityService();
        }
    }

    /**
     * Obtém a chave de API armazenada
     * @returns {string|null} Chave de API ou null se não existir
     */
    static getApiKey() {
        const unlocked = sessionStorage.getItem(this.SESSION_UNLOCK_KEY);
        if (unlocked) {
            return unlocked;
        }

        return null;
    }

    static setSessionPin(pin) {
        this.SESSION_PIN = pin && pin.trim ? pin.trim() : null;
        return this.SESSION_PIN;
    }

    static getSessionPin() {
        return this.SESSION_PIN;
    }

    static clearSessionPin() {
        this.SESSION_PIN = null;
    }

    static setLocalAccessUnlocked(isUnlocked) {
        if (isUnlocked) {
            sessionStorage.setItem(this.LOCAL_ACCESS_UNLOCK_KEY, '1');
        } else {
            sessionStorage.removeItem(this.LOCAL_ACCESS_UNLOCK_KEY);
        }
    }

    static hasLocalAccessUnlocked() {
        return sessionStorage.getItem(this.LOCAL_ACCESS_UNLOCK_KEY) === '1';
    }

    /**
     * Indica se existe um vault persistido da API key
     * @returns {boolean}
     */
    static hasStoredApiKey() {
        return Boolean(localStorage.getItem(this.KEY_STORAGE_NAME));
    }

    /**
     * Armazena a API key criptografada por PIN e libera a sessao atual
     * @param {string} apiKey
     * @param {string} pin
     */
    static async saveApiKey(apiKey, pin) {
        this._initSecurity();

        if (!pin) {
            throw new Error('PIN obrigatorio para salvar a API key com seguranca');
        }

        if (!this.securityService || !this.securityService.isWebCryptoAvailable()) {
            throw new Error('Web Crypto indisponivel para proteger a API key');
        }

        const encryptedVault = await this.securityService.encryptWithPin({ apiKey }, pin, {
            type: 'api-key-vault',
            storageKey: this.KEY_STORAGE_NAME
        });

        localStorage.setItem(this.KEY_STORAGE_NAME, JSON.stringify(encryptedVault));
        sessionStorage.setItem(this.SESSION_UNLOCK_KEY, apiKey);
        this.setSessionPin(pin);

        if (window.StorageManager && typeof StorageManager.saveInstallationPinVerifier === 'function') {
            await StorageManager.saveInstallationPinVerifier(pin);
        }

        this._dispatchApiStateChange();

        return apiKey;
    }

    /**
     * Desbloqueia a API key persistida usando um PIN local
     * @param {string} pin
     * @returns {Promise<string|null>}
     */
    static async unlockApiKey(pin) {
        this._initSecurity();

        if (!pin) {
            return null;
        }

        const encryptedVault = localStorage.getItem(this.KEY_STORAGE_NAME);
        if (!encryptedVault || !this.securityService) {
            return null;
        }

        let parsedVault;
        try {
            parsedVault = JSON.parse(encryptedVault);
        } catch (error) {
            throw new Error('Vault da API key corrompido');
        }

        const vault = await this.securityService.decryptWithPin(parsedVault, pin);
        const apiKey = vault && vault.apiKey ? vault.apiKey : null;

        if (apiKey) {
            sessionStorage.setItem(this.SESSION_UNLOCK_KEY, apiKey);
            this.setSessionPin(pin);

            if (window.StorageManager && typeof StorageManager.hasInstallationPinVerifier === 'function' && typeof StorageManager.saveInstallationPinVerifier === 'function' && !StorageManager.hasInstallationPinVerifier()) {
                await StorageManager.saveInstallationPinVerifier(pin);
            }

            this._dispatchApiStateChange();
        }

        return apiKey;
    }

    /**
     * Remove a chave de API armazenada
     */
    static clearApiKey() {
        localStorage.removeItem(this.KEY_STORAGE_NAME);
        sessionStorage.removeItem(this.SESSION_UNLOCK_KEY);
        sessionStorage.removeItem(this.LOCAL_ACCESS_UNLOCK_KEY);
        this.clearSessionPin();
        
        this.API_LOADED = false;
        this._dispatchApiStateChange();
        
        // Remover script do Google Maps
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            existingScript.remove();
        }
    }

    static async validateAndSaveApiKey(apiKey, pin) {
        try {
            // Primeiro validar com Places API
            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.id'
                },
                body: JSON.stringify({
                    textQuery: "test",
                    maxResultCount: 1
                })
            });

            if (!response.ok) {
                let apiErrorPayload = null;

                try {
                    apiErrorPayload = await response.json();
                } catch (parseError) {
                    apiErrorPayload = null;
                }

                const apiError = apiErrorPayload && apiErrorPayload.error ? apiErrorPayload.error : null;
                const apiDetails = Array.isArray(apiError && apiError.details) ? apiError.details : [];
                const errorInfo = apiDetails.find(detail => detail && detail['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo');
                const localizedMessage = apiDetails.find(detail => detail && detail['@type'] === 'type.googleapis.com/google.rpc.LocalizedMessage');
                const reason = errorInfo && errorInfo.reason ? errorInfo.reason : '';
                const defaultMessage = apiError && apiError.message
                    ? apiError.message
                    : (localizedMessage && localizedMessage.message ? localizedMessage.message : 'Chave API inválida ou sem permissões necessárias');

                if (reason === 'API_KEY_HTTP_REFERRER_BLOCKED' || reason === 'API_KEY_SERVICE_BLOCKED') {
                    throw new Error('A chave foi recusada pelas restrições atuais. Confirme se a Places API está habilitada e se o referrer usado agora está permitido no Google Cloud Console.');
                }

                if (window.location && window.location.protocol === 'file:' && (reason === 'API_KEY_HTTP_REFERRER_BLOCKED' || response.status === 403)) {
                    throw new Error('A chave foi recusada neste acesso por arquivo local. Se ela estiver restrita por HTTP referrer, abra o projeto em localhost e adicione esse endereço nas restrições da chave.');
                }

                throw new Error(defaultMessage || 'Chave API inválida ou sem permissões necessárias');
            }

            if (pin) {
                await this.saveApiKey(apiKey, pin);
            }

            return true;
            
        } catch (error) {
            console.error('Erro ao validar chave API:', error);
            throw error;
        }
    }

    static async loadGoogleMapsAPI(apiKey) {
        if (this.API_LOADED && window.google && window.google.maps) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                // Remover script anterior se existir
                const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
                if (existingScript) {
                    existingScript.remove();
                }

                // Criar novo script
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap&loading=async`;
                script.async = true;
                script.defer = true;

                // Configurar callback de carregamento
                window.initMap = () => {
                    console.log('Google Maps API carregada com sucesso');
                    this.API_LOADED = true;
                    resolve();
                };

                script.onerror = (error) => {
                    console.error('Erro ao carregar Google Maps API:', error);
                    this.API_LOADED = false;
                    reject(new Error('Falha ao carregar a API do Google Maps'));
                };

                // Adicionar script ao documento
                document.head.appendChild(script);
            } catch (error) {
                console.error('Erro ao configurar script do Google Maps:', error);
                this.API_LOADED = false;
                reject(error);
            }
        });
    }

    static async ensureApiLoaded() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Chave API não destravada nesta sessão');
        }

        if (!this.API_LOADED || !window.google || !window.google.maps) {
            await this.loadGoogleMapsAPI(apiKey);
        }
    }
} 