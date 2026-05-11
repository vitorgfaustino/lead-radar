/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Sistema de exportacao, importacao e auto backup.
 * Gera snapshots completos do estado local, com suporte a backup seguro por PIN.
 */

class StorageManager {
    static APP_NAME = 'Busca Empresas';
    static SNAPSHOT_VERSION = '2.0.0';
    static MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024;
    static INSTALLATION_MARKER_KEY = 'buscaEmpresasInstallationMarker';
    static INSTALLATION_PIN_VERIFIER_KEY = 'buscaEmpresasInstallationPinVerifier';
    static UNLOCKABLE_USER_DATA_KEYS = [
        'prospectedPlaces',
        'leads',
        'leadNotes',
        'searchHistory',
        'userPreferences',
        'emailTemplates',
        'contactSequences',
        'scheduledActions',
        'leadScores'
    ];
    static STORAGE_MANIFEST = [
        { key: 'googlePlacesApiKey', sensitive: true, description: 'Vault legada da API key' },
        { key: 'buscaEmpresasInstallationPinVerifier', sensitive: true, description: 'Verificador criptografado do PIN unico da instalacao' },
        { key: '_securityKey', sensitive: true, description: 'Chave legada para dados criptografados locais' },
        { key: 'preferredView', sensitive: false, description: 'Preferencia de visualizacao' },
        { key: 'prospectedPlaces', sensitive: false, description: 'Empresas marcadas como prospectadas' },
        { key: 'leads', sensitive: true, description: 'Base principal de leads e anotacoes' },
        { key: 'leadNotes', sensitive: true, description: 'Compatibilidade com notas legadas' },
        { key: 'searchHistory', sensitive: true, description: 'Historico de buscas e empresas' },
        { key: 'userPreferences', sensitive: false, description: 'Preferencias do usuario' },
        { key: 'emailTemplates', sensitive: true, description: 'Templates de email' },
        { key: 'contactSequences', sensitive: true, description: 'Sequencias de contato' },
        { key: 'scheduledActions', sensitive: true, description: 'Acoes agendadas' },
        { key: 'leadScores', sensitive: false, description: 'Scores calculados dos leads' },
        { key: 'leadScoreConfig', sensitive: false, description: 'Configuracao do score' },
        { key: 'autoBackupSettings', sensitive: false, description: 'Configuracao local do auto backup' },
        { key: 'autoBackupStatus', sensitive: false, description: 'Status local do auto backup' }
    ];

    static getSecurityService() {
        if (window.securityService) {
            return window.securityService;
        }

        if (typeof SecurityService !== 'undefined') {
            window.securityService = new SecurityService();
            return window.securityService;
        }

        return null;
    }

    static getManifestKeys() {
        return this.STORAGE_MANIFEST.map(entry => entry.key);
    }

    static hasAnyPersistedData() {
        return this.STORAGE_MANIFEST.some(entry => localStorage.getItem(entry.key) !== null);
    }

    static hasMeaningfulStoredValue(key) {
        const rawValue = localStorage.getItem(key);
        if (rawValue === null) {
            return false;
        }

        try {
            return this.hasMeaningfulValue(JSON.parse(rawValue));
        } catch {
            return this.hasMeaningfulValue(rawValue);
        }
    }

    static hasMeaningfulValue(value) {
        if (value === null || typeof value === 'undefined') {
            return false;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === 'object') {
            return Object.keys(value).length > 0;
        }

        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        return Boolean(value);
    }

    static hasUnlockableUserData() {
        return this.UNLOCKABLE_USER_DATA_KEYS.some(key => this.hasMeaningfulStoredValue(key));
    }

    static hasUnlockableLocalState() {
        const hasStoredVault = this.hasMeaningfulStoredValue('googlePlacesApiKey');
        const hasPinVerifier = this.hasMeaningfulStoredValue(this.INSTALLATION_PIN_VERIFIER_KEY);
        return hasStoredVault || (hasPinVerifier && this.hasUnlockableUserData());
    }

    static hasInstallationMarker() {
        return localStorage.getItem(this.INSTALLATION_MARKER_KEY) === '1';
    }

    static setInstallationMarker(isEnabled = true) {
        if (isEnabled) {
            localStorage.setItem(this.INSTALLATION_MARKER_KEY, '1');
        } else {
            localStorage.removeItem(this.INSTALLATION_MARKER_KEY);
        }
    }

    static hasInstallationPinVerifier() {
        return Boolean(localStorage.getItem(this.INSTALLATION_PIN_VERIFIER_KEY));
    }

    static validateInstallationSecret(value, label = 'Senha') {
        const secret = String(value || '').trim();
        if (!secret) {
            throw new Error(`Digite a ${label.toLowerCase()} para continuar.`);
        }

        if (secret.length < 4 || secret.length > 12) {
            throw new Error(`A ${label.toLowerCase()} deve ter entre 4 e 12 caracteres.`);
        }

        if (!/^[A-Za-z0-9]+$/.test(secret)) {
            throw new Error(`A ${label.toLowerCase()} deve usar apenas letras e números, sem símbolos ou caracteres especiais.`);
        }

        return secret;
    }

    static async saveInstallationPinVerifier(pin) {
        const security = this.getSecurityService();
        if (!security || !security.isWebCryptoAvailable()) {
            throw new Error('Servico de seguranca indisponivel para registrar o PIN unico da instalacao');
        }

        const verifier = await security.encryptWithPin({
            type: 'installation-pin-verifier',
            appName: this.APP_NAME
        }, pin, {
            type: 'installation-pin-verifier',
            storageKey: this.INSTALLATION_PIN_VERIFIER_KEY
        });

        localStorage.setItem(this.INSTALLATION_PIN_VERIFIER_KEY, JSON.stringify(verifier));
        this.setInstallationMarker(true);

        if (window.ApiKeyService && ApiKeyService.setSessionPin) {
            ApiKeyService.setSessionPin(pin);
        }

        return true;
    }

    static async validateInstallationPin(pin) {
        const normalizedPin = this.validateInstallationSecret(pin, 'Senha da instalação');

        const verifierRaw = localStorage.getItem(this.INSTALLATION_PIN_VERIFIER_KEY);
        if (verifierRaw) {
            const security = this.getSecurityService();
            if (!security) {
                throw new Error('Servico de seguranca indisponivel para validar o PIN da instalacao');
            }

            let verifierPayload;
            try {
                verifierPayload = JSON.parse(verifierRaw);
            } catch {
                throw new Error('Verificador do PIN da instalacao corrompido');
            }

            try {
                const verifier = await security.decryptWithPin(verifierPayload, normalizedPin);
                if (!verifier || verifier.type !== 'installation-pin-verifier') {
                    throw new Error('Senha da instalação inválida para esta instalação.');
                }

                if (window.ApiKeyService && ApiKeyService.setSessionPin) {
                    ApiKeyService.setSessionPin(normalizedPin);
                }

                return normalizedPin;
            } catch {
                throw new Error('Senha da instalação inválida para esta instalação.');
            }
        }

        if (window.ApiKeyService && ApiKeyService.hasStoredApiKey && ApiKeyService.hasStoredApiKey()) {
            const unlockedKey = await ApiKeyService.unlockApiKey(normalizedPin);
            if (!unlockedKey) {
                throw new Error('Senha da instalação inválida para esta instalação.');
            }

            await this.saveInstallationPinVerifier(normalizedPin);
            return normalizedPin;
        }

        throw new Error('Esta instalação ainda não possui uma senha verificável. Configure a API com uma senha de instalação ou restaure um backup seguro.');
    }

    static async rotateInstallationSecret(currentSecret, newSecret) {
        const normalizedCurrentSecret = this.validateInstallationSecret(currentSecret, 'Senha atual');
        const normalizedNewSecret = this.validateInstallationSecret(newSecret, 'Nova senha');

        if (normalizedCurrentSecret === normalizedNewSecret) {
            throw new Error('A nova senha precisa ser diferente da senha atual.');
        }

        const currentValidation = await this.validateInstallationPin(normalizedCurrentSecret);
        if (!currentValidation) {
            throw new Error('Senha atual inválida para esta instalação.');
        }

        const hasStoredApiKey = Boolean(window.ApiKeyService && typeof ApiKeyService.hasStoredApiKey === 'function' && ApiKeyService.hasStoredApiKey());
        const unlockedApiKey = hasStoredApiKey && window.ApiKeyService && typeof ApiKeyService.unlockApiKey === 'function'
            ? await ApiKeyService.unlockApiKey(normalizedCurrentSecret)
            : null;

        if (hasStoredApiKey && !unlockedApiKey) {
            throw new Error('Não foi possível abrir a chave API com a senha atual.');
        }

        if (hasStoredApiKey && unlockedApiKey) {
            await ApiKeyService.saveApiKey(unlockedApiKey, normalizedNewSecret);
        } else {
            await this.saveInstallationPinVerifier(normalizedNewSecret);
        }

        if (window.ApiKeyService && ApiKeyService.setSessionPin) {
            ApiKeyService.setSessionPin(normalizedNewSecret);
        }

        return {
            success: true,
            message: hasStoredApiKey
                ? 'Senha de criptografia atualizada e vault da API recriptografado com sucesso.'
                : 'Senha de criptografia atualizada com sucesso.'
        };
    }

    static readStoredValue(key, fallback = null) {
        const rawValue = localStorage.getItem(key);
        if (rawValue === null) {
            return fallback;
        }

        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    }

    static writeStoredValue(key, value) {
        if (value === null || typeof value === 'undefined') {
            localStorage.removeItem(key);
            return null;
        }

        if (typeof value === 'string') {
            localStorage.setItem(key, value);
            return value;
        }

        localStorage.setItem(key, JSON.stringify(value));
        return value;
    }

    static readStoredArray(key, fallback = []) {
        const value = this.readStoredValue(key, fallback);
        return Array.isArray(value) ? value : fallback;
    }

    static readStoredObject(key, fallback = {}) {
        const value = this.readStoredValue(key, fallback);
        return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    }

    static writeStoredArray(key, arrayValue) {
        if (!Array.isArray(arrayValue)) {
            throw new Error(`Valor invalido para array persistido: ${key}`);
        }

        return this.writeStoredValue(key, arrayValue);
    }

    static readStoredSet(key, fallback = []) {
        return new Set(this.readStoredArray(key, fallback));
    }

    static writeStoredSet(key, setValue) {
        if (!(setValue instanceof Set)) {
            throw new Error(`Valor invalido para Set persistido: ${key}`);
        }

        return this.writeStoredArray(key, [...setValue]);
    }

    static writeStoredObject(key, objectValue) {
        if (!objectValue || typeof objectValue !== 'object' || Array.isArray(objectValue)) {
            throw new Error(`Valor invalido para objeto persistido: ${key}`);
        }

        return this.writeStoredValue(key, objectValue);
    }

    static safeParseStorageValue(rawValue) {
        if (typeof rawValue !== 'string') {
            return rawValue;
        }

        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    }

    static normalizeImportedValue(value) {
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    static collectStorageData() {
        const data = {};
        const modules = [];

        this.STORAGE_MANIFEST.forEach(entry => {
            const rawValue = localStorage.getItem(entry.key);
            if (rawValue === null) {
                return;
            }

            data[entry.key] = this.safeParseStorageValue(rawValue);
            modules.push({
                key: entry.key,
                sensitive: entry.sensitive,
                description: entry.description,
                bytes: new Blob([rawValue]).size
            });
        });

        return { data, modules };
    }

    static async buildSnapshot(source = 'manual-export') {
        const { data, modules } = this.collectStorageData();
        if (modules.length === 0) {
            throw new Error('Nao ha dados para exportar');
        }

        const snapshot = {
            metadata: {
                appName: this.APP_NAME,
                version: this.SNAPSHOT_VERSION,
                format: 'full-snapshot',
                exportDate: new Date().toISOString(),
                source,
                encrypted: false,
                moduleCount: modules.length,
                modules
            },
            data
        };

        const security = this.getSecurityService();
        if (security && security.isWebCryptoAvailable()) {
            snapshot.metadata.checksum = await security.createChecksum(snapshot.data);
        }

        return snapshot;
    }

    static async buildEncryptedPackage(pin, source = 'secure-export') {
        const security = this.getSecurityService();
        if (!security) {
            throw new Error('Servico de seguranca indisponivel');
        }

        const activePin = pin || (window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null);
        if (!activePin) {
            throw new Error('PIN obrigatorio para proteger o snapshot');
        }

        const snapshot = await this.buildSnapshot(source);
        const payload = await security.encryptWithPin(snapshot, activePin, {
            appName: this.APP_NAME,
            snapshotVersion: this.SNAPSHOT_VERSION,
            source
        });

        return {
            metadata: {
                appName: this.APP_NAME,
                version: this.SNAPSHOT_VERSION,
                format: 'encrypted-snapshot',
                exportDate: new Date().toISOString(),
                encrypted: true,
                source
            },
            payload
        };
    }

    static validateSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            throw new Error('Snapshot invalido');
        }

        if (!snapshot.metadata || !snapshot.data) {
            throw new Error('Formato de snapshot invalido');
        }

        if (snapshot.metadata.appName !== this.APP_NAME) {
            throw new Error('Este arquivo nao pertence ao Busca Empresas');
        }

        if (typeof snapshot.data !== 'object' || Array.isArray(snapshot.data)) {
            throw new Error('Payload do snapshot invalido');
        }

        Object.keys(snapshot.data).forEach(key => {
            if (!this.getManifestKeys().includes(key)) {
                throw new Error(`Modulo nao suportado no snapshot: ${key}`);
            }
        });
    }

    static async verifySnapshotIntegrity(snapshot) {
        const security = this.getSecurityService();
        if (!security || !security.isWebCryptoAvailable() || !snapshot.metadata.checksum) {
            return true;
        }

        const currentChecksum = await security.createChecksum(snapshot.data);
        if (currentChecksum !== snapshot.metadata.checksum) {
            throw new Error('Checksum do snapshot nao confere');
        }

        return true;
    }

    static async parseBackupObject(parsedData, options = {}) {
        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Arquivo de backup invalido');
        }

        if (parsedData.metadata && parsedData.metadata.format === 'encrypted-snapshot') {
            const activePin = options.pin || (window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null);
            if (!activePin) {
                throw new Error('PIN obrigatorio para restaurar backup seguro');
            }

            const security = this.getSecurityService();
            if (!security) {
                throw new Error('Servico de seguranca indisponivel');
            }

            const snapshot = await security.decryptWithPin(parsedData.payload, activePin);
            this.validateSnapshot(snapshot);
            await this.verifySnapshotIntegrity(snapshot);
            return snapshot;
        }

        this.validateSnapshot(parsedData);
        await this.verifySnapshotIntegrity(parsedData);
        return parsedData;
    }

    static createRollbackState() {
        const rollbackState = {};
        this.STORAGE_MANIFEST.forEach(entry => {
            rollbackState[entry.key] = localStorage.getItem(entry.key);
        });
        rollbackState[this.INSTALLATION_MARKER_KEY] = localStorage.getItem(this.INSTALLATION_MARKER_KEY);
        return rollbackState;
    }

    static restoreRollbackState(rollbackState) {
        this.STORAGE_MANIFEST.forEach(entry => {
            const previousValue = rollbackState[entry.key];
            if (previousValue === null || typeof previousValue === 'undefined') {
                localStorage.removeItem(entry.key);
            } else {
                localStorage.setItem(entry.key, previousValue);
            }
        });

        const markerValue = rollbackState[this.INSTALLATION_MARKER_KEY];
        if (markerValue === null || typeof markerValue === 'undefined') {
            localStorage.removeItem(this.INSTALLATION_MARKER_KEY);
        } else {
            localStorage.setItem(this.INSTALLATION_MARKER_KEY, markerValue);
        }
    }

    static async importSnapshot(snapshot) {
        this.validateSnapshot(snapshot);
        await this.verifySnapshotIntegrity(snapshot);
        const rollbackState = this.createRollbackState();

        try {
            this.STORAGE_MANIFEST.forEach(entry => {
                localStorage.removeItem(entry.key);
            });

            let importCount = 0;
            Object.entries(snapshot.data).forEach(([key, value]) => {
                localStorage.setItem(key, this.normalizeImportedValue(value));
                importCount++;
            });

            this.setInstallationMarker(true);

            return {
                success: true,
                message: `Backup restaurado com sucesso. ${importCount} modulo(s) aplicados.`,
                count: importCount,
                importDate: new Date().toISOString(),
                version: snapshot.metadata.version
            };
        } catch (error) {
            this.restoreRollbackState(rollbackState);
            throw error;
        }
    }

    static downloadObject(payload, fileName) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    static async exportData(options = {}) {
        const settings = {
            encryptWithPin: false,
            pin: null,
            source: 'manual-export',
            filePrefix: 'busca-empresas-backup',
            download: true,
            ...options
        };

        try {
            const payload = settings.encryptWithPin
                ? await this.buildEncryptedPackage(settings.pin, settings.source)
                : await this.buildSnapshot(settings.source);

            if (settings.download) {
                const dateSuffix = new Date().toISOString().split('T')[0];
                this.downloadObject(payload, `${settings.filePrefix}-${dateSuffix}.json`);
            }

            return {
                success: true,
                message: settings.encryptWithPin
                    ? 'Backup seguro exportado com sucesso!'
                    : 'Backup exportado com sucesso!',
                payload
            };
        } catch (error) {
            return {
                success: false,
                message: `Erro ao exportar dados: ${error.message}`
            };
        }
    }

    static async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            reader.readAsText(file);
        });
    }

    static async importData(file, options = {}) {
        if (!file) {
            throw { success: false, message: 'Nenhum arquivo selecionado' };
        }

        const isJsonType = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
        if (!isJsonType) {
            throw { success: false, message: 'O arquivo deve ser do tipo JSON' };
        }

        if (file.size > this.MAX_IMPORT_SIZE_BYTES) {
            throw { success: false, message: 'O arquivo excede o limite de 10MB para importacao segura' };
        }

        try {
            const text = await this.readFileAsText(file);
            const parsed = JSON.parse(text);
            const snapshot = await this.parseBackupObject(parsed, options);
            const result = await this.importSnapshot(snapshot);

            if (result.success && options.pin) {
                await this.saveInstallationPinVerifier(options.pin);
            }

            return result;
        } catch (error) {
            throw {
                success: false,
                message: `Erro ao importar dados: ${error.message || error}`
            };
        }
    }

    static clearAllData(confirmationRequired = true) {
        try {
            if (confirmationRequired) {
                const confirmed = confirm('ATENCAO: Esta acao apagara TODOS os dados locais do sistema. Deseja continuar?');
                if (!confirmed) {
                    return { success: false, message: 'Operacao cancelada pelo usuario' };
                }
            }

            this.STORAGE_MANIFEST.forEach(entry => {
                localStorage.removeItem(entry.key);
            });
            this.setInstallationMarker(false);

            return { success: true, message: 'Todos os dados locais foram apagados com sucesso' };
        } catch (error) {
            return { success: false, message: `Erro ao limpar dados: ${error.message}` };
        }
    }
}

async function requestMaskedPin(options = {}) {
    const settings = {
        title: 'Digite a senha',
        description: 'A senha não será exibida enquanto você digita.',
        label: 'Senha',
        confirmLabel: 'Confirmar senha',
        confirmPin: false,
        placeholder: 'Digite a senha',
        confirmPlaceholder: 'Confirme a senha',
        ...options
    };

    const dialog = document.getElementById('pinDialog');
    const title = document.getElementById('pinDialogTitle');
    const description = document.getElementById('pinDialogDescription');
    const label = document.getElementById('pinDialogLabel');
    const input = document.getElementById('pinDialogInput');
    const confirmWrap = document.getElementById('pinDialogConfirmWrap');
    const confirmLabel = document.getElementById('pinDialogConfirmLabel');
    const confirmInput = document.getElementById('pinDialogConfirmInput');
    const errorNode = document.getElementById('pinDialogError');
    const submitBtn = document.getElementById('pinDialogSubmitBtn');
    const cancelBtn = document.getElementById('pinDialogCancelBtn');
    const closeBtn = document.getElementById('pinDialogCloseBtn');

    if (!dialog || !title || !description || !label || !input || !confirmWrap || !confirmLabel || !confirmInput || !errorNode || !submitBtn || !cancelBtn || !closeBtn) {
        return prompt(settings.title, '');
    }

    return new Promise(resolve => {
        const cleanup = () => {
            dialog.classList.add('hidden');
            dialog.style.display = '';
            input.value = '';
            confirmInput.value = '';
            confirmWrap.classList.add('hidden');
            errorNode.classList.add('hidden');
            errorNode.textContent = '';
            submitBtn.removeEventListener('click', handleSubmit);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            input.removeEventListener('keydown', handleKeydown);
            confirmInput.removeEventListener('keydown', handleKeydown);
            dialog.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEscape);
        };

        const showError = message => {
            errorNode.textContent = message;
            errorNode.classList.remove('hidden');
        };

        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        const handleBackdrop = event => {
            if (event.target === dialog) {
                handleCancel();
            }
        };

        const handleEscape = event => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        const handleKeydown = event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
            }
        };

        const handleSubmit = async () => {
            const pin = input.value.trim();
            const confirmation = confirmInput.value.trim();

            errorNode.classList.add('hidden');
            errorNode.textContent = '';

            if (!pin) {
                input.focus();
                showError('Digite a senha para continuar.');
                return;
            }

            try {
                StorageManager.validateInstallationSecret(pin, 'Senha');
            } catch (error) {
                showError(error?.message || 'Senha inválida.');
                input.focus();
                return;
            }

            if (settings.confirmPin && pin !== confirmation) {
                showError('As senhas digitadas não conferem.');
                confirmInput.focus();
                return;
            }

            if (typeof settings.validate === 'function') {
                try {
                    await settings.validate(pin);
                } catch (error) {
                    showError(error?.message || 'PIN invalido.');
                    input.focus();
                    return;
                }
            }

            cleanup();
            resolve(pin);
        };

        title.textContent = settings.title;
        description.textContent = settings.description;
        label.textContent = settings.label;
        input.placeholder = settings.placeholder;
        confirmLabel.textContent = settings.confirmLabel;
        confirmInput.placeholder = settings.confirmPlaceholder;
        confirmWrap.classList.toggle('hidden', !settings.confirmPin);

        submitBtn.textContent = settings.confirmPin ? 'Confirmar senha' : 'Continuar';

        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
        input.addEventListener('keydown', handleKeydown);
        confirmInput.addEventListener('keydown', handleKeydown);
        dialog.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleEscape);

        dialog.classList.remove('hidden');
        dialog.style.display = 'flex';
        input.focus();
    });
}

window.requestMaskedPin = requestMaskedPin;
window.showMaskedPinDialog = requestMaskedPin;

class AutoBackupService {
    static DB_NAME = 'BuscaEmpresasAutoBackup';
    static STORE_NAME = 'snapshots';
    static SETTINGS_KEY = 'autoBackupSettings';
    static STATUS_KEY = 'autoBackupStatus';
    static INTERVAL_ID = null;

    static isIndexedDBAvailable() {
        return Boolean(window.indexedDB);
    }

    static openDatabase() {
        if (!this.isIndexedDBAvailable()) {
            return Promise.reject(new Error('IndexedDB nao esta disponivel neste navegador'));
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);

            request.onerror = () => reject(request.error || new Error('Falha ao abrir banco de auto backup'));
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    static readSettings() {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            return raw ? JSON.parse(raw) : {
                enabled: false,
                intervalMinutes: 30,
                maxSnapshots: 10
            };
        } catch {
            return {
                enabled: false,
                intervalMinutes: 30,
                maxSnapshots: 10
            };
        }
    }

    static saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        return settings;
    }

    static readStatus() {
        try {
            const raw = localStorage.getItem(this.STATUS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    static updateStatus(statusPatch) {
        const nextStatus = {
            ...this.readStatus(),
            ...statusPatch,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STATUS_KEY, JSON.stringify(nextStatus));
        return nextStatus;
    }

    static async saveEncryptedSnapshot(pin, reason = 'auto-backup') {
        const encryptedPackage = await StorageManager.buildEncryptedPackage(pin || (window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null), reason);
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const snapshotRecord = {
                id: `backup-${Date.now()}`,
                createdAt: new Date().toISOString(),
                reason,
                payload: encryptedPackage
            };

            store.put(snapshotRecord);

            transaction.oncomplete = async () => {
                await this.pruneSnapshots();
                this.updateStatus({
                    lastSuccessAt: snapshotRecord.createdAt,
                    lastReason: reason,
                    lastError: null
                });
                resolve(snapshotRecord);
            };

            transaction.onerror = () => {
                const message = transaction.error ? transaction.error.message : 'Falha ao salvar auto backup';
                this.updateStatus({ lastError: message });
                reject(new Error(message));
            };
        });
    }

    static async listSnapshots() {
        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const snapshots = (request.result || []).sort((left, right) => {
                    return new Date(right.createdAt) - new Date(left.createdAt);
                });
                resolve(snapshots);
            };

            request.onerror = () => reject(request.error || new Error('Falha ao listar auto backups'));
        });
    }

    static async pruneSnapshots() {
        const settings = this.readSettings();
        const snapshots = await this.listSnapshots();
        const extraSnapshots = snapshots.slice(settings.maxSnapshots);

        if (extraSnapshots.length === 0) {
            return;
        }

        const db = await this.openDatabase();
        await new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            extraSnapshots.forEach(snapshot => {
                store.delete(snapshot.id);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error || new Error('Falha ao remover auto backups antigos'));
        });
    }

    static stopScheduler() {
        if (this.INTERVAL_ID) {
            clearInterval(this.INTERVAL_ID);
            this.INTERVAL_ID = null;
        }
    }

    static startScheduler() {
        const settings = this.readSettings();
        this.stopScheduler();

        if (!settings.enabled) {
            return;
        }

        this.INTERVAL_ID = window.setInterval(async () => {
            try {
                const sessionPin = window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null;
                if (!sessionPin) {
                    return;
                }

                await this.saveEncryptedSnapshot(sessionPin, 'scheduled-auto-backup');
            } catch (error) {
                this.updateStatus({ lastError: error.message });
            }
        }, Math.max(settings.intervalMinutes, 1) * 60 * 1000);
    }

    static async enable(pin, options = {}) {
        const activePin = pin || (window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null);
        if (!activePin || activePin.trim().length < 4) {
            throw new Error('Defina uma senha com pelo menos 4 caracteres para o auto backup');
        }

        if (window.ApiKeyService && ApiKeyService.setSessionPin) {
            ApiKeyService.setSessionPin(activePin);
        }
        const currentSettings = this.readSettings();
        const nextSettings = this.saveSettings({
            ...currentSettings,
            enabled: true,
            intervalMinutes: Number(options.intervalMinutes) || currentSettings.intervalMinutes || 30,
            maxSnapshots: Number(options.maxSnapshots) || currentSettings.maxSnapshots || 10,
            configuredAt: new Date().toISOString()
        });

        await this.saveEncryptedSnapshot(activePin, 'enable-auto-backup');
        this.startScheduler();
        return nextSettings;
    }

    static disable() {
        this.stopScheduler();
        const currentSettings = this.readSettings();
        return this.saveSettings({
            ...currentSettings,
            enabled: false,
            disabledAt: new Date().toISOString()
        });
    }

    static async restoreLatest(pin) {
        const activePin = pin || (window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null);
        const snapshots = await this.listSnapshots();
        if (snapshots.length === 0) {
            throw new Error('Nenhum auto backup disponivel para restauracao');
        }

        const latestSnapshot = snapshots[0];
        const snapshot = await StorageManager.parseBackupObject(latestSnapshot.payload, { pin: activePin });
        const result = await StorageManager.importSnapshot(snapshot);

        this.updateStatus({
            lastRestoreAt: new Date().toISOString(),
            lastRestoreSource: latestSnapshot.id,
            lastError: null
        });

        return result;
    }
}

class BackupUI {
    constructor() {
        this.setupEventListeners();
    }

    async requestPin(options = {}) {
        const settings = {
            title: 'Digite o PIN unico da instalacao:',
            confirmPin: false,
            ...options
        };

        const sessionPin = window.ApiKeyService && ApiKeyService.getSessionPin ? ApiKeyService.getSessionPin() : null;
        if (sessionPin) {
            return sessionPin;
        }

        return requestMaskedPin(settings);
    }

    async validateInstallationPin(pin) {
        if (!pin) {
            return null;
        }

        if (window.ApiKeyService && ApiKeyService.getSessionPin && ApiKeyService.getSessionPin() === pin) {
            return pin;
        }

        return StorageManager.validateInstallationPin(pin);
    }

    async requestValidatedInstallationPin(options = {}) {
        const pin = await requestMaskedPin({
            ...options,
            validate: value => this.validateInstallationPin(value)
        });

        return pin || null;
    }

    updateAutoBackupStatus() {
        const statusElement = document.getElementById('autoBackupStatusText');
        const reminderElement = document.getElementById('manualBackupReminderText');
        const enableAutoBackupBtn = document.getElementById('enableAutoBackupBtn');
        const disableAutoBackupBtn = document.getElementById('disableAutoBackupBtn');
        const autoBackupPanel = document.getElementById('autoBackupPanel');
        if (!statusElement) {
            return;
        }

        const settings = AutoBackupService.readSettings();
        const status = AutoBackupService.readStatus();

        if (enableAutoBackupBtn) {
            enableAutoBackupBtn.classList.toggle('hidden', Boolean(settings.enabled));
        }

        if (disableAutoBackupBtn) {
            disableAutoBackupBtn.classList.toggle('hidden', !settings.enabled);
        }

        if (autoBackupPanel) {
            autoBackupPanel.classList.toggle('border-sky-400/25', Boolean(settings.enabled));
            autoBackupPanel.classList.toggle('bg-sky-500/[0.08]', Boolean(settings.enabled));
            autoBackupPanel.classList.toggle('border-white/10', !settings.enabled);
            autoBackupPanel.classList.toggle('bg-white/[0.03]', !settings.enabled);
        }

        if (reminderElement) {
            reminderElement.textContent = settings.enabled
                ? 'Mesmo com backup AUTO local, vale exportar um backup manual periodicamente: semanal, a cada 15 dias ou no minimo uma vez por mes.'
                : 'Recomendacao: exporte um backup manual ao menos a cada 7 dias. Se o uso for menor, faca isso a cada 15 ou 30 dias.';
        }

        if (!settings.enabled) {
            statusElement.textContent = 'Backup manual ativo. Exporte seu backup sempre que fizer alteracoes relevantes na base local.';
            statusElement.className = 'text-xs text-slate-300 mt-4 leading-relaxed';
            if (reminderElement) {
                reminderElement.className = 'text-xs text-slate-400 mt-2 leading-relaxed';
            }
            return;
        }

        if (!(window.ApiKeyService && ApiKeyService.getSessionPin && ApiKeyService.getSessionPin())) {
            statusElement.textContent = 'Backup auto configurado. Informe a senha de instalação nesta sessao para voltar a gerar novos snapshots automaticos.';
            statusElement.className = 'text-xs text-sky-100 mt-4 leading-relaxed';
            if (reminderElement) {
                reminderElement.className = 'text-xs text-sky-100/80 mt-2 leading-relaxed';
            }
            return;
        }

        const lastSuccess = status.lastSuccessAt
            ? new Date(status.lastSuccessAt).toLocaleString('pt-BR')
            : 'ainda nao executado';
        statusElement.textContent = `Backup auto ativo nesta configuracao. Ultimo sucesso: ${lastSuccess}.`;
        statusElement.className = 'text-xs text-sky-100 mt-4 leading-relaxed';
        if (reminderElement) {
            reminderElement.className = 'text-xs text-sky-100/80 mt-2 leading-relaxed';
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const secureExportBtn = document.getElementById('exportSecureDataBtn');
            const importBtnContainer = document.getElementById('importDataBtnContainer');
            const enableAutoBackupBtn = document.getElementById('enableAutoBackupBtn');
            const restoreAutoBackupBtn = document.getElementById('restoreAutoBackupBtn');
            const disableAutoBackupBtn = document.getElementById('disableAutoBackupBtn');
            const rotateSecretBtn = document.getElementById('rotateSecretBtn');
            const rotateSecretCurrentInput = document.getElementById('rotateSecretCurrentInput');
            const rotateSecretNewInput = document.getElementById('rotateSecretNewInput');
            const rotateSecretStatus = document.getElementById('rotateSecretStatus');
            const clearDataBtn = document.getElementById('clearDataBtn');
            const fileInput = document.getElementById('importFileInput');
            const openBackupModalBtn = document.getElementById('openBackupModalBtn');
            const closeBackupModalBtn = document.getElementById('closeBackupModalBtn');
            const backupModal = document.getElementById('backupModal');

            if (secureExportBtn) {
                secureExportBtn.addEventListener('click', () => this.handleSecureExport());
            }

            if (importBtnContainer && fileInput) {
                importBtnContainer.addEventListener('click', () => {
                    fileInput.click();
                });
                fileInput.addEventListener('change', event => this.handleImport(event));
            }

            if (enableAutoBackupBtn) {
                enableAutoBackupBtn.addEventListener('click', () => this.handleEnableAutoBackup());
            }

            if (restoreAutoBackupBtn) {
                restoreAutoBackupBtn.addEventListener('click', () => this.handleRestoreAutoBackup());
            }

            if (disableAutoBackupBtn) {
                disableAutoBackupBtn.addEventListener('click', () => this.handleDisableAutoBackup());
            }

            if (clearDataBtn) {
                clearDataBtn.addEventListener('click', () => this.handleClearData());
            }

            if (rotateSecretBtn) {
                rotateSecretBtn.addEventListener('click', () => this.handleRotateInstallationSecret({
                    currentInput: rotateSecretCurrentInput,
                    newInput: rotateSecretNewInput,
                    statusNode: rotateSecretStatus,
                    buttonNode: rotateSecretBtn
                }));
            }

            if (openBackupModalBtn && backupModal) {
                openBackupModalBtn.addEventListener('click', () => {
                    this.updateAutoBackupStatus();
                    backupModal.classList.remove('hidden');
                });
            }

            if (closeBackupModalBtn && backupModal) {
                closeBackupModalBtn.addEventListener('click', () => {
                    backupModal.classList.add('hidden');
                });
            }

            if (backupModal) {
                backupModal.addEventListener('click', event => {
                    if (event.target === backupModal) {
                        backupModal.classList.add('hidden');
                    }
                });
            }

            document.querySelectorAll('.download-option').forEach(option => {
                option.classList.add('cursor-pointer', 'hover:bg-gray-700', 'transition-colors');
            });

            this.updateAutoBackupStatus();
        });
    }

    async handleExport() {
        return this.handleSecureExport();
    }

    async handleSecureExport() {
        try {
            const validatedPin = await this.requestValidatedInstallationPin({
                title: 'Digite a senha de instalação para proteger este backup seguro:'
            });

            if (!validatedPin) {
                return;
            }

            const result = await StorageManager.exportData({
                encryptWithPin: true,
                pin: validatedPin,
                source: 'manual-secure-export',
                filePrefix: 'busca-empresas-backup-seguro'
            });

            this.showNotification(result.message, result.success);
        } catch (error) {
            this.showNotification(error.message, false);
        }
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        event.target.value = '';

        try {
            const fileText = await StorageManager.readFileAsText(file);
            const parsed = JSON.parse(fileText);
            let pin = null;

            if (parsed.metadata && parsed.metadata.format === 'encrypted-snapshot') {
                pin = await this.requestValidatedInstallationPin({ title: 'Digite a senha de instalação para restaurar:' });
                if (!pin) {
                    return;
                }
            }

            const normalizedFile = new File([fileText], file.name, { type: 'application/json' });
            const result = await StorageManager.importData(normalizedFile, { pin });
            this.showNotification(result.message, result.success);

            if (result.success) {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            this.showNotification(error.message || 'Falha ao importar backup', false);
        }
    }

    async handleEnableAutoBackup() {
        try {
            if (!AutoBackupService.isIndexedDBAvailable()) {
                throw new Error('Este navegador nao oferece IndexedDB para auto backup local resiliente');
            }

            const validatedPin = await this.requestValidatedInstallationPin({
                title: 'Digite a senha de instalação para ativar o backup auto:'
            });

            if (!validatedPin) {
                return;
            }

            const intervalValue = prompt('Intervalo do auto backup em minutos:', '30');
            const intervalMinutes = Number(intervalValue || '30');
            await AutoBackupService.enable(validatedPin, { intervalMinutes, maxSnapshots: 10 });
            this.updateAutoBackupStatus();
            this.showNotification('Backup auto ativado e snapshot inicial salvo no IndexedDB do navegador.', true);
        } catch (error) {
            this.showNotification(error.message, false);
        }
    }

    async handleRestoreAutoBackup() {
        try {
            const validatedPin = await this.requestValidatedInstallationPin({ title: 'Digite o PIN unico da instalacao para restaurar o ultimo auto backup:' });
            if (!validatedPin) {
                return;
            }

            const result = await AutoBackupService.restoreLatest(validatedPin);
            this.showNotification(result.message, result.success);

            if (result.success) {
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            this.showNotification(error.message, false);
        }
    }

    async handleRotateInstallationSecret({ currentInput, newInput, statusNode, buttonNode }) {
        const currentSecret = currentInput?.value.trim();
        const newSecret = newInput?.value.trim();

        if (statusNode) {
            statusNode.classList.add('hidden');
            statusNode.textContent = '';
        }

        try {
            if (window.StorageManager && typeof StorageManager.validateInstallationSecret === 'function') {
                StorageManager.validateInstallationSecret(currentSecret, 'Senha atual');
                StorageManager.validateInstallationSecret(newSecret, 'Nova senha');
            }

            if (buttonNode) {
                buttonNode.disabled = true;
            }

            if (statusNode) {
                statusNode.className = 'mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100';
                statusNode.textContent = 'Atualizando senha de criptografia...';
                statusNode.classList.remove('hidden');
            }

            const result = await StorageManager.rotateInstallationSecret(currentSecret, newSecret);

            if (currentInput) {
                currentInput.value = '';
            }

            if (newInput) {
                newInput.value = '';
            }

            if (AutoBackupService.readSettings().enabled) {
                AutoBackupService.startScheduler();
            }

            this.updateAutoBackupStatus();

            if (statusNode) {
                statusNode.className = 'mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100';
                statusNode.textContent = result.message;
                statusNode.classList.remove('hidden');
            }

            this.showNotification(result.message, true);
        } catch (error) {
            if (statusNode) {
                statusNode.className = 'mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100';
                statusNode.textContent = error.message || 'Falha ao alterar a senha de criptografia.';
                statusNode.classList.remove('hidden');
            }

            this.showNotification(error.message || 'Falha ao alterar a senha de criptografia.', false);
        } finally {
            if (buttonNode) {
                buttonNode.disabled = false;
            }
        }
    }

    handleDisableAutoBackup() {
        AutoBackupService.disable();
        this.updateAutoBackupStatus();
        this.showNotification('Backup auto desativado nesta configuracao.', true);
    }

    handleClearData() {
        const result = StorageManager.clearAllData(true);
        this.showNotification(result.message, result.success);

        if (result.success) {
            setTimeout(() => window.location.reload(), 1500);
        }
    }

    showNotification(message, isSuccess = true) {
        let notification = document.getElementById('backupNotification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'backupNotification';
            notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-y-full opacity-0';
            document.body.appendChild(notification);
        }

        if (isSuccess) {
            notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 bg-green-100 border-l-4 border-green-500 text-green-700';
        } else {
            notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 bg-red-100 border-l-4 border-red-500 text-red-700';
        }

        notification.replaceChildren();

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';

        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'flex-shrink-0';

        const icon = document.createElement('i');
        icon.className = `fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
        iconWrapper.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'flex-1';

        const text = document.createElement('p');
        text.className = 'font-medium';
        text.textContent = message;
        content.appendChild(text);

        const closeButton = document.createElement('button');
        closeButton.className = 'ml-auto text-gray-500 hover:text-gray-700';
        closeButton.type = 'button';
        closeButton.addEventListener('click', () => {
            notification.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                if (notification.isConnected) {
                    notification.remove();
                }
            }, 300);
        });

        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeButton.appendChild(closeIcon);

        wrapper.append(iconWrapper, content, closeButton);
        notification.appendChild(wrapper);

        setTimeout(() => {
            notification.classList.remove('translate-y-full', 'opacity-0');
        }, 10);

        setTimeout(() => {
            if (!notification.isConnected) {
                return;
            }

            notification.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                if (notification.isConnected) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

const backupSystem = new BackupUI();

window.StorageManager = StorageManager;
window.AutoBackupService = AutoBackupService;
window.BackupUI = backupSystem;
