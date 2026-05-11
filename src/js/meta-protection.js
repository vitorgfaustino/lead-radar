/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * meta-protection.js
 * Script para garantir que todas as pu00e1ginas, mu00eddias e recursos estejam protegidos contra indexau00e7u00e3o
 */

(function() {
    // Verifica se as meta tags de proteu00e7u00e3o ju00e1 existem
    function ensureMetaTags() {
        const metaTags = [
            { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet, noodp, noimageindex' },
            { name: 'googlebot', content: 'noindex, nofollow, noarchive, nosnippet, noodp, noimageindex' },
            { name: 'bingbot', content: 'noindex, nofollow, noarchive, nosnippet, noodp, noimageindex' },
            { name: 'Baiduspider', content: 'noindex, nofollow' },
            { name: 'YandexBot', content: 'noindex, nofollow' },
            { httpEquiv: 'X-Robots-Tag', content: 'noindex, nofollow, noarchive, nosnippet, noodp, noimageindex, notranslate, unavailable_after: 1-Jan-2000 00:00:00 GMT' }
        ];

        metaTags.forEach(metaInfo => {
            let metaExists = false;
            
            if (metaInfo.name) {
                metaExists = !!document.querySelector(`meta[name="${metaInfo.name}"]`);
                
                if (!metaExists) {
                    const meta = document.createElement('meta');
                    meta.name = metaInfo.name;
                    meta.content = metaInfo.content;
                    document.head.appendChild(meta);
                }
            } else if (metaInfo.httpEquiv) {
                metaExists = !!document.querySelector(`meta[http-equiv="${metaInfo.httpEquiv}"]`);
                
                if (!metaExists) {
                    const meta = document.createElement('meta');
                    meta.httpEquiv = metaInfo.httpEquiv;
                    meta.content = metaInfo.content;
                    document.head.appendChild(meta);
                }
            }
        });
    }

    // Adiciona atributos noindex a todos os links
    function protectLinks() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.setAttribute('rel', 'nofollow');
        });
    }

    // Adiciona atributos noindex a todas as imagens
    function protectImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('referrerpolicy', 'no-referrer');
        });
    }

    // Bloqueia requisiu00e7u00f5es de bots conhecidos
    function blockBotRequests() {
        const botPatterns = [
            'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
            'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
            'showyoubot', 'outbrain', 'pinterest', 'slackbot', 'vkShare', 'W3C_Validator',
            'crawler', 'spider', 'robot', 'crawling', 'bot'
        ];
        
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (botPatterns.some(pattern => userAgent.includes(pattern))) {
            document.body.innerHTML = 'Acesso negado.';
            document.title = 'Acesso negado';
            return true;
        }
        
        return false;
    }

    // Executa todas as proteu00e7u00f5es
    function applyProtection() {
        if (!blockBotRequests()) {
            ensureMetaTags();
            protectLinks();
            protectImages();
        }
    }

    // Aplica as proteu00e7u00f5es quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyProtection);
    } else {
        applyProtection();
    }

    // Reaplica as proteu00e7u00f5es quando o DOM for modificado
    const observer = new MutationObserver(function(mutations) {
        applyProtection();
    });

    // Inicia a observau00e7u00e3o do DOM
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
