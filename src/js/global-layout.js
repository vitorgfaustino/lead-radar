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

    const SOURCE_REPOSITORY_URL = 'https://github.com/vitorgfaustino/lead-radar';
    const DEFAULT_VERSION = '1.0.0';
    const NAV_ITEMS = [
        {
            key: 'radar',
            href: 'index.html',
            label: 'Radar',
            icon: 'travel_explore',
            title: 'Abrir busca de empresas no radar'
        },
        {
            key: 'history',
            href: 'historico.html',
            label: 'Histórico',
            icon: 'history',
            title: 'Abrir histórico de consultas e leads salvos'
        },
        {
            key: 'kanban',
            href: 'kanban.html',
            label: 'Kanban',
            icon: 'view_kanban',
            title: 'Abrir painel visual para mover e priorizar leads'
        }
    ];
    const PAGE_META = {
        radar: {
            title: 'LeadRadar',
            mobileNote: 'Use o menu para navegar entre Radar, Histórico e Kanban. As configurações locais concentram API, ajuda, backup e recuperação.'
        },
        history: {
            title: 'Histórico de Leads',
            mobileNote: 'Navegue entre as páginas principais e use Configurações para abrir ajuda, API e backup sem espalhar atalhos pelo topo.'
        },
        kanban: {
            title: 'Kanban de Leads',
            mobileNote: 'Use Configurações para abrir ajuda, backup e conexão da API. O restante do fluxo operacional fica no próprio painel.'
        },
        help: {
            title: 'Ajuda e Aprendizado',
            mobileNote: 'Esta página explica o fluxo de uso. As configurações continuam centralizadas para manter a navegação consistente.'
        }
    };

    function getCurrentPageKey() {
        const explicitPage = document.body?.dataset?.pageView;
        if (explicitPage && PAGE_META[explicitPage]) {
            return explicitPage;
        }

        const fileName = window.location.pathname.split('/').pop() || 'index.html';
        if (fileName === 'historico.html') {
            return 'history';
        }
        if (fileName === 'kanban.html') {
            return 'kanban';
        }
        if (fileName === 'ajuda.html') {
            return 'help';
        }
        return 'radar';
    }

    function createTemplateFragment(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    }

    function replaceNodeWithHtml(node, html) {
        if (!node) {
            return;
        }

        node.replaceWith(createTemplateFragment(html));
    }

    function getSettingsDesktopControl(currentPageKey) {
        if (currentPageKey === 'radar') {
            return `
                <button id="openBackupModalBtn" type="button" class="btn-secondary text-sm px-3 py-2 rounded-lg flex items-center gap-2" title="Abrir central de configurações, backup, ajuda e segurança">
                    <span class="material-icons" style="font-size:18px">settings</span>
                    <span>Configurações</span>
                </button>
            `;
        }

        return `
            <a href="index.html#settings" class="btn-secondary text-sm px-3 py-2 rounded-lg flex items-center gap-2" title="Abrir a central de configurações no Radar">
                <span class="material-icons" style="font-size:18px">settings</span>
                <span>Configurações</span>
            </a>
        `;
    }

    function getSettingsMobileControl(currentPageKey) {
        if (currentPageKey === 'radar') {
            return `
                <button type="button" class="crm-offcanvas-action" data-header-menu-trigger="#openBackupModalBtn">
                    <span class="material-icons" style="font-size:18px">settings</span>
                    <span>Configurações</span>
                </button>
            `;
        }

        return `
            <a href="index.html#settings" class="crm-offcanvas-action">
                <span class="material-icons" style="font-size:18px">settings</span>
                <span>Configurações</span>
            </a>
        `;
    }

    function buildNavLinks(currentPageKey, mobile = false) {
        const baseClass = mobile ? 'crm-offcanvas-link' : 'crm-header-link';

        return NAV_ITEMS.map(item => {
            const isActive = item.key === currentPageKey;
            const activeClass = isActive ? ' active' : '';
            const ariaCurrent = isActive ? ' aria-current="page"' : '';
            const title = mobile ? '' : ` title="${item.title}"`;
            return `
                <a href="${item.href}" class="${baseClass}${activeClass}"${ariaCurrent}${title}>
                    <span class="material-icons" style="font-size:18px">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');
    }

    function renderGlobalHeader() {
        const anchor = document.querySelector('[data-global-header]');
        if (!anchor) {
            return;
        }

        const currentPageKey = getCurrentPageKey();
        const pageMeta = PAGE_META[currentPageKey] || PAGE_META.radar;

        replaceNodeWithHtml(anchor, `
            <header class="premium-header">
                <div class="crm-header-shell py-3">
                    <div class="crm-header-grid">
                        <div class="crm-header-brand">
                            <a href="index.html" class="premium-logo-mark flex-shrink-0" aria-label="Abrir Radar">
                                <img src="src/assets/images/logo.webp" alt="Porketo" class="h-7 w-auto" loading="lazy" width="120" height="36">
                            </a>
                        </div>
                        <button type="button" class="crm-header-toggle lg:hidden" data-header-menu-toggle aria-label="Abrir menu">
                            <span class="material-icons" style="font-size:20px">menu</span>
                            Menu
                        </button>
                        <div class="crm-header-actions hidden lg:flex">
                            ${buildNavLinks(currentPageKey)}
                            ${getSettingsDesktopControl(currentPageKey)}
                        </div>
                    </div>
                </div>
            </header>
            <div class="crm-offcanvas-backdrop lg:hidden" data-header-menu-backdrop></div>
            <aside class="crm-offcanvas-panel lg:hidden" data-header-menu-panel aria-label="Menu mobile">
                <div class="crm-offcanvas-header">
                    <div class="min-w-0">
                        <strong class="block text-white truncate">${pageMeta.title}</strong>
                        <span class="text-xs text-gray-400 uppercase tracking-[0.18em]">Menu global</span>
                    </div>
                    <button type="button" class="crm-header-toggle" data-header-menu-close aria-label="Fechar menu">
                        <span class="material-icons" style="font-size:20px">close</span>
                    </button>
                </div>
                <nav class="crm-offcanvas-nav">
                    ${buildNavLinks(currentPageKey, true)}
                    ${getSettingsMobileControl(currentPageKey)}
                </nav>
                <p class="crm-offcanvas-note">${pageMeta.mobileNote}</p>
            </aside>
        `);
    }

    function getApiConnectionState() {
        const unlockedApiKey = sessionStorage.getItem('googlePlacesApiKeyUnlocked');
        const storedApiVault = localStorage.getItem('googlePlacesApiKey');

        return {
            connected: Boolean(unlockedApiKey),
            hasStoredVault: Boolean(storedApiVault)
        };
    }

    function renderApiAlert() {
        const pageKey = getCurrentPageKey();
        const mainContent = document.querySelector('main, .help-shell');
        const existingAlert = document.getElementById('globalApiConnectionAlert');
        const { connected, hasStoredVault } = getApiConnectionState();

        if (existingAlert) {
            existingAlert.remove();
        }

        if (!mainContent || connected) {
            return;
        }

        const title = hasStoredVault
            ? 'API ainda não liberada nesta sessão'
            : 'API do Google ainda não configurada';
        const description = hasStoredVault
            ? 'A chave já existe no navegador, mas a sessão atual ainda não destravou o acesso. Abra Configurações para liberar ou atualizar a chave.'
            : 'As buscas e recursos conectados continuam bloqueados até você validar a chave do Google Places. Abra Configurações para concluir a conexão.';
        const action = pageKey === 'radar'
            ? '<button type="button" class="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" data-open-settings><span class="material-icons" style="font-size:18px">vpn_key</span><span>Conectar API</span></button>'
            : '<a href="index.html#settings" class="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"><span class="material-icons" style="font-size:18px">settings</span><span>Abrir Configurações</span></a>';

        mainContent.insertAdjacentHTML('beforebegin', `
            <section id="globalApiConnectionAlert" class="crm-header-shell pt-4">
                <div class="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-4 md:px-5 md:py-5 text-amber-100 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div class="min-w-0">
                            <div class="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                                <span class="material-icons" style="font-size:14px">warning</span>
                                Conexão pendente
                            </div>
                            <h2 class="mt-3 text-base md:text-lg font-semibold text-white">${title}</h2>
                            <p class="mt-1 text-sm leading-relaxed text-amber-100/90 max-w-3xl">${description}</p>
                        </div>
                        <div class="shrink-0">
                            ${action}
                        </div>
                    </div>
                </div>
            </section>
        `);
    }

    function bindApiAlertRefresh() {
        window.addEventListener('leadradar:api-state-changed', renderApiAlert);
        window.addEventListener('storage', event => {
            if (event.key === 'googlePlacesApiKey' || event.key === 'googlePlacesApiKeyUnlocked') {
                renderApiAlert();
            }
        });
    }

    function renderGlobalFooter() {
        const anchor = document.querySelector('[data-global-footer]');
        if (!anchor) {
            return;
        }

        replaceNodeWithHtml(anchor, `
            <footer class="py-4 border-t border-gray-700 text-center text-sm text-gray-500 bg-bg-primary mt-auto">
                <div class="crm-header-shell flex flex-col items-center gap-2">
                    <div>&copy; <span id="footerYear">2026</span> &bull; Versão <span id="projectVersion">${DEFAULT_VERSION}</span></div>
                    <a href="${SOURCE_REPOSITORY_URL}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">Codigo-fonte AGPL-3.0 no GitHub</a>
                </div>
            </footer>
        `);
    }

    function updateProjectMetadata() {
        const footerYear = document.getElementById('footerYear');
        if (footerYear) {
            footerYear.textContent = String(new Date().getFullYear());
        }

        const projectVersion = document.getElementById('projectVersion');
        if (projectVersion) {
            projectVersion.textContent = window.PROJECT_VERSION || DEFAULT_VERSION;
        }
    }

    function openSettingsFromAnywhere() {
        const openSettingsButton = document.getElementById('openBackupModalBtn');
        if (openSettingsButton) {
            openSettingsButton.click();
            return;
        }

        window.location.href = 'index.html#settings';
    }

    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-open-settings]');
        if (!trigger) {
            return;
        }

        event.preventDefault();
        openSettingsFromAnywhere();
    });

    renderGlobalHeader();
    renderGlobalFooter();
    updateProjectMetadata();
    renderApiAlert();
    bindApiAlertRefresh();

    document.addEventListener('DOMContentLoaded', () => {
        updateProjectMetadata();
        renderApiAlert();

        if (getCurrentPageKey() === 'radar' && window.location.hash === '#settings') {
            openSettingsFromAnywhere();
        }
    });
})();