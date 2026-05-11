/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Script para corrigir o funcionamento dos botões "Não prospectado" nos resultados
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando correção para os botões de prospectado/não prospectado');
    
    // Garantir que prospectedPlaces existe no escopo global
    if (!window.prospectedPlaces) {
        window.prospectedPlaces = StorageManager.readStoredSet('prospectedPlaces', []);
    }
    
    // Função para adicionar eventos aos botões de prospectado/não prospectado
    function addProspectedButtonEvents() {
        document.querySelectorAll('.prospected-badge').forEach(badge => {
            // Verificar se o botão já tem o evento (para evitar duplicação)
            if (badge.dataset.hasEventListener) return;
            
            badge.dataset.hasEventListener = 'true';
            badge.addEventListener('click', function() {
                const placeId = this.dataset.placeId;
                if (!placeId) return;
                
                const isProspected = this.classList.contains('prospected');
                
                // Alternar o estado de prospectado
                if (isProspected) {
                    // Remover da lista de prospectados
                    window.prospectedPlaces.delete(placeId);
                    this.classList.remove('prospected');
                    const span = this.querySelector('span');
                    if (span) span.textContent = 'Não Prospectado';
                } else {
                    // Adicionar à lista de prospectados
                    window.prospectedPlaces.add(placeId);
                    this.classList.add('prospected');
                    const span = this.querySelector('span');
                    if (span) span.textContent = 'Prospectado';
                }
                
                // Salvar no localStorage
                StorageManager.writeStoredSet('prospectedPlaces', window.prospectedPlaces);
                
                // Atualizar outros badges com o mesmo placeId
                document.querySelectorAll(`.prospected-badge[data-place-id="${placeId}"]`).forEach(otherBadge => {
                    if (otherBadge !== this) {
                        otherBadge.classList.toggle('prospected', !isProspected);
                        const span = otherBadge.querySelector('span');
                        if (span) {
                            span.textContent = isProspected ? 'Não Prospectado' : 'Prospectado';
                        }
                    }
                });
                
                console.log(`Status de prospectado alterado para ${placeId}: ${!isProspected}`);
                
                // Disparar evento personalizado para notificar outras partes do sistema
                const event = new CustomEvent('prospectedStatusChanged', {
                    detail: { placeId, isProspected: !isProspected }
                });
                document.dispatchEvent(event);
            });
        });
    }
    
    // Observar mudanças no DOM para adicionar eventos a novos botões
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Verificar se algum dos nós adicionados contém botões de prospectado
                setTimeout(addProspectedButtonEvents, 100);
            }
        });
    });
    
    // Configurar o observer para monitorar todo o documento
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Também adicionar eventos após a exibição de resultados
    const originalExibirResultadosLista = window.exibirResultadosLista;
    const originalExibirResultadosGrid = window.exibirResultadosGrid;
    
    if (originalExibirResultadosLista) {
        window.exibirResultadosLista = function() {
            originalExibirResultadosLista.apply(this, arguments);
            setTimeout(addProspectedButtonEvents, 100);
        };
    }
    
    if (originalExibirResultadosGrid) {
        window.exibirResultadosGrid = function() {
            originalExibirResultadosGrid.apply(this, arguments);
            setTimeout(addProspectedButtonEvents, 100);
        };
    }
    
    // Adicionar eventos aos botões existentes
    setTimeout(addProspectedButtonEvents, 500);
});
