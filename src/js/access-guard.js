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

    function hasUnlockedVault() {
        return Boolean(sessionStorage.getItem('googlePlacesApiKeyUnlocked'))
            || sessionStorage.getItem('buscaEmpresasLocalAccessUnlocked') === '1';
    }

    if (!hasUnlockedVault()) {
        window.location.replace('index.html');
    }
})();