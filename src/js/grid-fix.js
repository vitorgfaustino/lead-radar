/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Script para garantir que a visualização em grid sempre exiba 3 colunas
 * Este script sobrescreve qualquer configuração que possa estar interferindo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando correção para o grid de 3 colunas');
    
    // Função para configurar o grid corretamente
    function fixGridLayout() {
        const gridView = document.getElementById('gridView');
        if (!gridView) return;
        
        // Aplicar estilos inline para garantir 3 colunas
        gridView.style.display = 'grid';
        gridView.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        gridView.style.gap = '1rem';
        gridView.style.padding = '1rem';
        
        console.log('Layout de grid corrigido para 3 colunas');
    }
    
    // Observar mudanças no estilo do gridView
    const gridView = document.getElementById('gridView');
    if (gridView) {
        // Usar MutationObserver para detectar mudanças no estilo do elemento
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' && 
                    gridView.style.display !== 'none' && 
                    gridView.style.display !== 'grid') {
                    fixGridLayout();
                }
            });
        });
        
        // Configurar o observer para monitorar mudanças de atributos
        observer.observe(gridView, { attributes: true });
        
        // Corrigir o layout quando a visualização for alternada
        const viewToggleBtn = document.getElementById('viewToggleBtn');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', function() {
                // Pequeno atraso para garantir que a correção seja aplicada após a alternância
                setTimeout(fixGridLayout, 10);
            });
        }
        
        // Também corrigir quando os botões de lista/grid forem clicados
        const listViewBtn = document.getElementById('listViewBtn');
        const gridViewBtn = document.getElementById('gridViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', function() {
                setTimeout(fixGridLayout, 10);
            });
        }
        
        // Aplicar a correção inicial
        if (StorageManager.readStoredValue('preferredView', 'list') === 'grid') {
            setTimeout(fixGridLayout, 100);
        }
    }
    
    // Também corrigir quando os resultados forem exibidos
    const originalExibirResultadosGrid = window.exibirResultadosGrid;
    if (originalExibirResultadosGrid) {
        window.exibirResultadosGrid = function() {
            originalExibirResultadosGrid.apply(this, arguments);
            setTimeout(fixGridLayout, 10);
        };
    }
});
