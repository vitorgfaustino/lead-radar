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

    function closeMenu(panel, backdrop) {
        if (panel) {
            panel.classList.remove('is-open');
        }
        if (backdrop) {
            backdrop.classList.remove('is-open');
        }
        document.body.classList.remove('header-menu-open');
    }

    function openMenu(panel, backdrop) {
        if (panel) {
            panel.classList.add('is-open');
        }
        if (backdrop) {
            backdrop.classList.add('is-open');
        }
        document.body.classList.add('header-menu-open');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.querySelector('[data-header-menu-toggle]');
        const panel = document.querySelector('[data-header-menu-panel]');
        const backdrop = document.querySelector('[data-header-menu-backdrop]');
        const closeButton = document.querySelector('[data-header-menu-close]');

        if (!toggle || !panel || !backdrop) {
            return;
        }

        const closeTargets = [backdrop, closeButton].filter(Boolean);
        const triggerTargets = document.querySelectorAll('[data-header-menu-trigger]');
        const closeLinks = panel.querySelectorAll('a, button');

        toggle.addEventListener('click', () => {
            const isOpen = panel.classList.contains('is-open');
            if (isOpen) {
                closeMenu(panel, backdrop);
            } else {
                openMenu(panel, backdrop);
            }
        });

        closeTargets.forEach(target => {
            target.addEventListener('click', () => closeMenu(panel, backdrop));
        });

        triggerTargets.forEach(target => {
            target.addEventListener('click', event => {
                const selector = target.dataset.headerMenuTrigger;
                const externalTarget = selector ? document.querySelector(selector) : null;
                if (externalTarget) {
                    externalTarget.click();
                }
                closeMenu(panel, backdrop);
                if (target.tagName !== 'A') {
                    event.preventDefault();
                }
            });
        });

        closeLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (link.dataset.keepHeaderMenuOpen === 'true') {
                    return;
                }
                closeMenu(panel, backdrop);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeMenu(panel, backdrop);
            }
        });
    });
})();
