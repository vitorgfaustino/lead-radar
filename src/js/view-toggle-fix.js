/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Script para corrigir a alternância entre visualizações de lista e grid
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando script de correção para alternância de visualizações');
    
    // Função para configurar o grid corretamente
    function setupGridView() {
        const gridView = document.getElementById('gridView');
        gridView.className = 'grid-view';
        gridView.style.display = 'grid';
        gridView.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        gridView.style.gap = '1rem';
        gridView.style.padding = '1rem';
    }
    
    // Função para alternar entre visualizações
    function toggleView(viewType) {
        console.log('Alternando para visualização:', viewType);
        
        // Elementos de visualização
        const listView = document.getElementById('listView');
        const gridView = document.getElementById('gridView');
        
        // Botões de alternância
        const listViewBtn = document.getElementById('listViewBtn');
        const gridViewBtn = document.getElementById('gridViewBtn');
        
        // Verificar se os elementos existem
        if (!listView || !gridView) {
            console.error('Elementos de visualização não encontrados', { listView, gridView });
            return;
        }
        
        if (!listViewBtn || !gridViewBtn) {
            console.error('Botões de visualização não encontrados', { listViewBtn, gridViewBtn });
            return;
        }
        
        // Salvar preferência do usuário
        StorageManager.writeStoredValue('preferredView', viewType);
        
        // Esconder ambas as visualizações primeiro
        listView.style.display = 'none';
        gridView.style.display = 'none';
        
        // Remover classe ativa de ambos os botões
        listViewBtn.classList.remove('active');
        gridViewBtn.classList.remove('active');
        
        // Mostrar apenas a visualização selecionada
        if (viewType === 'list') {
            listView.style.display = 'block';
            listViewBtn.classList.add('active');
            console.log('Visualização em lista ativada');
        } else {
            setupGridView(); // Garantir que o grid esteja configurado corretamente
            // Importante: NÃO usar style.display = 'block' para o grid, pois isso sobrescreve o display: grid
            // Em vez disso, removemos o 'none' e deixamos o CSS aplicar o grid
            gridViewBtn.classList.add('active');
            console.log('Visualização em grid ativada');
        }
    }
    
    // Adicionar event listeners diretamente
    document.querySelector('#listViewBtn').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Botão de lista clicado');
        toggleView('list');
    });
    
    document.querySelector('#gridViewBtn').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Botão de grid clicado');
        toggleView('grid');
    });
    
    // Aplicar visualização inicial com base na preferência salva
    const savedView = StorageManager.readStoredValue('preferredView', 'list');
    console.log('Visualização inicial:', savedView);
    setTimeout(() => toggleView(savedView), 100); // Pequeno atraso para garantir que o DOM esteja pronto
    
    // Expor a função globalmente
    window.toggleView = toggleView;
});
