/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Serviu00e7o de Seguranu00e7a
 * Este serviu00e7o gerencia aspectos de seguranu00e7a da aplicau00e7u00e3o
 */
class SecurityService {
    static PIN_ENCRYPTION_VERSION = 'pin-aes-gcm-v1';
    static PBKDF2_ITERATIONS = 250000;

    constructor() {
        this.encryptionKey = this._getOrCreateEncryptionKey();
    }

    /**
     * Obtu00e9m ou cria uma chave de criptografia para o armazenamento local
     * @returns {string} Chave de criptografia
     * @private
     */
    _getOrCreateEncryptionKey() {
        let key = localStorage.getItem('_securityKey');
        
        if (!key) {
            // Gerar uma nova chave aleatu00f3ria
            key = this._generateRandomKey(32);
            localStorage.setItem('_securityKey', key);
        }
        
        return key;
    }

    /**
     * Gera uma chave aleatu00f3ria
     * @param {number} length - Tamanho da chave
     * @returns {string} Chave aleatu00f3ria
     * @private
     */
    _generateRandomKey(length = 32) {
        const randomBytes = new Uint8Array(length);

        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(randomBytes);
        } else {
            for (let i = 0; i < length; i++) {
                randomBytes[i] = Math.floor(Math.random() * 256);
            }
        }

        return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
    }

    /**
     * Verifica se o navegador suporta Web Crypto moderno
     * @returns {boolean}
     */
    isWebCryptoAvailable() {
        return Boolean(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
    }

    /**
     * Gera bytes aleatórios criptograficamente seguros
     * @param {number} length
     * @returns {Uint8Array}
     */
    generateSecureRandomBytes(length = 16) {
        const bytes = new Uint8Array(length);

        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
            return bytes;
        }

        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }

        return bytes;
    }

    /**
     * Converte Uint8Array para base64
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    bytesToBase64(bytes) {
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }

    /**
     * Converte base64 para Uint8Array
     * @param {string} base64
     * @returns {Uint8Array}
     */
    base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
    }

    /**
     * Deriva uma chave AES-GCM a partir de um PIN local
     * @param {string} pin
     * @param {Uint8Array} saltBytes
     * @returns {Promise<CryptoKey>}
     */
    async deriveKeyFromPin(pin, saltBytes) {
        if (!this.isWebCryptoAvailable()) {
            throw new Error('Web Crypto não está disponível neste navegador');
        }

        if (!pin || typeof pin !== 'string' || pin.trim().length < 4) {
            throw new Error('PIN inválido. Use pelo menos 4 caracteres');
        }

        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(pin),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: SecurityService.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: 256
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Criptografa um payload JSON usando PIN local
     * @param {any} data
     * @param {string} pin
     * @param {Object} metadata
     * @returns {Promise<Object>}
     */
    async encryptWithPin(data, pin, metadata = {}) {
        const encoder = new TextEncoder();
        const salt = this.generateSecureRandomBytes(16);
        const iv = this.generateSecureRandomBytes(12);
        const key = await this.deriveKeyFromPin(pin, salt);
        const serialized = JSON.stringify(data);
        const cipherBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            encoder.encode(serialized)
        );

        return {
            version: SecurityService.PIN_ENCRYPTION_VERSION,
            algorithm: 'AES-GCM',
            kdf: 'PBKDF2',
            iterations: SecurityService.PBKDF2_ITERATIONS,
            salt: this.bytesToBase64(salt),
            iv: this.bytesToBase64(iv),
            cipherText: this.bytesToBase64(new Uint8Array(cipherBuffer)),
            metadata: {
                createdAt: new Date().toISOString(),
                ...metadata
            }
        };
    }

    /**
     * Descriptografa um payload JSON protegido por PIN local
     * @param {Object} encryptedPayload
     * @param {string} pin
     * @returns {Promise<any>}
     */
    async decryptWithPin(encryptedPayload, pin) {
        if (!encryptedPayload || encryptedPayload.version !== SecurityService.PIN_ENCRYPTION_VERSION) {
            throw new Error('Formato de payload criptografado inválido');
        }

        const key = await this.deriveKeyFromPin(pin, this.base64ToBytes(encryptedPayload.salt));
        const plainBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: this.base64ToBytes(encryptedPayload.iv)
            },
            key,
            this.base64ToBytes(encryptedPayload.cipherText)
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(plainBuffer));
    }

    /**
     * Calcula um checksum SHA-256 em base64 para um payload JSON
     * @param {any} data
     * @returns {Promise<string>}
     */
    async createChecksum(data) {
        if (!this.isWebCryptoAvailable()) {
            return null;
        }

        const encoder = new TextEncoder();
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(payload));
        return this.bytesToBase64(new Uint8Array(digest));
    }

    /**
     * Criptografa dados para armazenamento
     * @param {any} data - Dados a serem criptografados
     * @returns {string} Dados criptografados
     */
    encrypt(data) {
        try {
            // Converter dados para string JSON
            const jsonString = JSON.stringify(data);
            
            // Implementau00e7u00e3o simples de criptografia para armazenamento local
            // Em um ambiente de produu00e7u00e3o, usar bibliotecas como CryptoJS
            let encrypted = '';
            for (let i = 0; i < jsonString.length; i++) {
                const charCode = jsonString.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                encrypted += String.fromCharCode(charCode);
            }
            
            // Codificar em base64 para armazenamento seguro
            return btoa(encrypted);
        } catch (error) {
            console.error('Erro ao criptografar dados:', error);
            return null;
        }
    }

    /**
     * Descriptografa dados armazenados
     * @param {string} encryptedData - Dados criptografados
     * @returns {any} Dados descriptografados
     */
    decrypt(encryptedData) {
        try {
            if (!encryptedData) return null;
            
            // Decodificar de base64
            const encrypted = atob(encryptedData);
            
            // Descriptografar
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                decrypted += String.fromCharCode(charCode);
            }
            
            // Converter de volta para objeto
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Erro ao descriptografar dados:', error);
            return null;
        }
    }

    /**
     * Sanitiza uma string para evitar ataques XSS
     * @param {string} input - String a ser sanitizada
     * @returns {string} String sanitizada
     */
    sanitizeString(input) {
        if (!input) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return input.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Valida uma chave de API do Google Maps
     * @param {string} apiKey - Chave de API a ser validada
     * @returns {boolean} Verdadeiro se a chave parece vu00e1lida
     */
    validateApiKey(apiKey) {
        // Verificau00e7u00e3o bu00e1sica de formato
        const apiKeyRegex = /^[A-Za-z0-9_-]{30,}$/;
        return apiKeyRegex.test(apiKey);
    }

    /**
     * Armazena dados de forma segura no localStorage
     * @param {string} key - Chave para armazenamento
     * @param {any} data - Dados a serem armazenados
     */
    secureStore(key, data) {
        const encrypted = this.encrypt(data);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
            return true;
        }
        return false;
    }

    /**
     * Recupera dados armazenados de forma segura no localStorage
     * @param {string} key - Chave de armazenamento
     * @returns {any} Dados armazenados ou null se nu00e3o existirem
     */
    secureRetrieve(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        
        return this.decrypt(encrypted);
    }

    /**
     * Remove dados armazenados de forma segura
     * @param {string} key - Chave de armazenamento
     */
    secureRemove(key) {
        localStorage.removeItem(key);
    }

    /**
     * Valida dados de template para prevenir XSS
     * @param {Object} templateData - Dados do template
     * @returns {Object} Resultado da validação
     */
    validateTemplateData(templateData) {
        const errors = [];
        const sanitized = {};
        
        // Validar nome
        if (templateData.name) {
            const name = this.sanitizeString(templateData.name);
            if (name.length < 3 || name.length > 100) {
                errors.push('Nome deve ter entre 3 e 100 caracteres');
            } else {
                sanitized.name = name;
            }
        }
        
        // Validar subject
        if (templateData.subject) {
            const subject = this.sanitizeString(templateData.subject);
            if (subject.length < 5 || subject.length > 200) {
                errors.push('Assunto deve ter entre 5 e 200 caracteres');
            } else {
                sanitized.subject = subject;
            }
        }
        
        // Validar body
        if (templateData.body) {
            const body = this.sanitizeHTML(templateData.body);
            if (body.length < 20 || body.length > 10000) {
                errors.push('Corpo deve ter entre 20 e 10000 caracteres');
            } else {
                sanitized.body = body;
            }
        }
        
        // Validar variáveis
        if (templateData.variables && Array.isArray(templateData.variables)) {
            const validVars = templateData.variables.filter(v =>
                typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            );
            if (validVars.length !== templateData.variables.length) {
                errors.push('Variáveis devem conter apenas letras, números e underscores');
            }
            sanitized.variables = validVars;
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitizedData: sanitized
        };
    }

    /**
     * Sanitiza HTML básico para templates
     * @param {string} html - HTML a sanitizar
     * @returns {string} HTML sanitizado
     */
    sanitizeHTML(html) {
        // Remover tags perigosas
        const dangerousTags = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<iframe|<object|<embed|<applet/gi;
        let sanitized = html.replace(dangerousTags, '');
        
        // Permitir tags seguras para formatação
        const safeTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        
        // Remover atributos perigosos
        sanitized = sanitized.replace(/\bon\w+=\s*["'][^"']*["']/gi, '');
        
        return sanitized;
    }

    /**
     * Valida dados de sequência
     * @param {Object} sequenceData - Dados da sequência
     * @returns {Object} Resultado da validação
     */
    validateSequenceData(sequenceData) {
        const errors = [];
        
        if (!sequenceData.name || sequenceData.name.trim().length < 3) {
            errors.push('Nome da sequência deve ter pelo menos 3 caracteres');
        }
        
        if (!sequenceData.steps || !Array.isArray(sequenceData.steps) || sequenceData.steps.length === 0) {
            errors.push('Sequência deve ter pelo menos um passo');
        } else {
            sequenceData.steps.forEach((step, index) => {
                if (!step.type || !['email', 'call', 'linkedin', 'whatsapp', 'call-reminder'].includes(step.type)) {
                    errors.push(`Passo ${index + 1}: Tipo inválido`);
                }
                
                if (step.delayDays < 0 || step.delayDays > 365) {
                    errors.push(`Passo ${index + 1}: Dias de delay devem estar entre 0 e 365`);
                }
                
                if (step.delayHours < 0 || step.delayHours > 23) {
                    errors.push(`Passo ${index + 1}: Horas de delay devem estar entre 0 e 23`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida dados de lead para score
     * @param {Object} leadData - Dados do lead
     * @returns {Object} Resultado da validação
     */
    validateLeadData(leadData) {
        const errors = [];
        
        if (!leadData.placeId && !leadData.id) {
            errors.push('Lead deve ter um ID');
        }
        
        if (leadData.rating && (leadData.rating < 0 || leadData.rating > 5)) {
            errors.push('Avaliação deve estar entre 0 e 5');
        }
        
        if (leadData.totalAvaliacoes && leadData.totalAvaliacoes < 0) {
            errors.push('Número de avaliações não pode ser negativo');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Limita tamanho do localStorage para prevenir overflow
     * @param {string} key - Chave do localStorage
     * @param {number} maxSizeKB - Tamanho máximo em KB
     * @returns {boolean} Se está dentro do limite
     */
    checkStorageLimit(key, maxSizeKB = 5120) { // 5MB default
        try {
            const data = localStorage.getItem(key);
            if (!data) return true;
            
            const sizeKB = (data.length * 2) / 1024; // Aproximação em KB
            
            if (sizeKB > maxSizeKB) {
                console.warn(`Armazenamento excedeu limite: ${sizeKB.toFixed(2)}KB > ${maxSizeKB}KB`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao verificar limite de armazenamento:', error);
            return false;
        }
    }

    /**
     * Limpa dados antigos do localStorage
     * @param {string} key - Chave do localStorage
     * @param {number} maxAgeDays - Idade máxima em dias
     */
    cleanupOldData(key, maxAgeDays = 90) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return;
            
            const parsed = JSON.parse(data);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - maxAgeDays);
            
            const filtered = {};
            Object.entries(parsed).forEach(([itemKey, itemData]) => {
                const updated = new Date(itemData.updatedAt || itemData.createdAt || '2000-01-01');
                if (updated >= cutoff) {
                    filtered[itemKey] = itemData;
                }
            });
            
            localStorage.setItem(key, JSON.stringify(filtered));
            
            return {
                removed: Object.keys(parsed).length - Object.keys(filtered).length,
                remaining: Object.keys(filtered).length
            };
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }
}

// Exportar a instância única do SecurityService
window.securityService = new SecurityService();
