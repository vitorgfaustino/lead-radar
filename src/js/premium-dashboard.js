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

    function readObject(key) {
        try {
            if (window.StorageManager && typeof StorageManager.readStoredObject === 'function') {
                return StorageManager.readStoredObject(key, {});
            }
            return JSON.parse(localStorage.getItem(key) || '{}') || {};
        } catch {
            return {};
        }
    }

    function readArray(key) {
        try {
            if (window.StorageManager && typeof StorageManager.readStoredArray === 'function') {
                return StorageManager.readStoredArray(key, []);
            }
            return JSON.parse(localStorage.getItem(key) || '[]') || [];
        } catch {
            return [];
        }
    }

    function readSetSize(key) {
        try {
            if (window.StorageManager && typeof StorageManager.readStoredSet === 'function') {
                return StorageManager.readStoredSet(key, []).size;
            }
            const value = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(value) ? value.length : 0;
        } catch {
            return 0;
        }
    }

    function setText(id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = String(value);
        }
    }

    function updateDashboardMetrics() {
        const uniqueCompanies = window.SearchHistoryService && typeof SearchHistoryService.getAllCompanies === 'function'
            ? SearchHistoryService.getAllCompanies().length
            : 0;
        const history = window.SearchHistoryService && typeof SearchHistoryService.getAllSessions === 'function'
            ? SearchHistoryService.getAllSessions()
            : readArray('searchHistory');
        const settings = readObject('autoBackupSettings');
        const isAutoEnabled = Boolean(settings && settings.enabled);

        setText('dashboardMetricLeads', uniqueCompanies);
        setText('dashboardMetricSearches', Array.isArray(history) ? history.length : 0);
        setText('dashboardMetricProspected', readSetSize('prospectedPlaces'));
        setText('dashboardMetricBackupLabel', 'Backup');
        setText('dashboardMetricBackup', isAutoEnabled ? 'AUTO Local' : 'Manual');
        setText('dashboardMetricBackupCaption', isAutoEnabled ? 'Snapshot local' : 'Exporte seu Backup');
    }

    document.addEventListener('DOMContentLoaded', updateDashboardMetrics);
    document.addEventListener('prospectedStatusChanged', updateDashboardMetrics);
    window.addEventListener('storage', updateDashboardMetrics);
})();
