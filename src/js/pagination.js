/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Sistema de Paginação Simples
 * Implementa paginação para exibir 21 resultados por página
 */

// Variáveis globais para controle de paginação
window.paginationState = {
    listCurrentPage: 1,
    gridCurrentPage: 1
};

/**
 * Função para paginar resultados
 * @param {Array} results - Array completo de resultados
 * @param {number} page - Número da página atual
 * @param {number} itemsPerPage - Itens por página (padrão: 21)
 * @returns {Array} - Resultados da página atual
 */
function paginarResultados(results, page = 1, itemsPerPage = 21) {
    // Calcular índices
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, results.length);
    
    // Retornar apenas os resultados da página atual
    return results.slice(startIndex, endIndex);
}

/**
 * Cria controles de paginação
 * @param {HTMLElement} container - Container onde os controles serão adicionados
 * @param {number} currentPage - Página atual
 * @param {number} totalPages - Total de páginas
 * @param {Function} onPageChange - Função a ser chamada quando a página mudar
 */
function criarControlesPaginacao(container, currentPage, totalPages, onPageChange) {
    // Criar container de paginação
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination flex justify-center items-center gap-2 mt-4 mb-4 p-2 bg-gray-800 rounded';
    
    // Texto informativo
    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-gray-300 text-sm mr-2';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    paginationControls.appendChild(pageInfo);
    
    // Botão anterior
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
        const prevIcon = document.createElement('i');
        prevIcon.className = 'fas fa-chevron-left';
        prevBtn.appendChild(prevIcon);
        prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
        paginationControls.appendChild(prevBtn);
    }
    
    // Botões de página (máximo 5)
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Ajustar se estiver perto do final
    if (endPage - startPage + 1 < maxButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn px-3 py-1 rounded ${i === currentPage ? 'bg-accent text-white' : 'bg-gray-700 text-gray-300'}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => onPageChange(i));
        paginationControls.appendChild(pageBtn);
    }
    
    // Botão próximo
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
        const nextIcon = document.createElement('i');
        nextIcon.className = 'fas fa-chevron-right';
        nextBtn.appendChild(nextIcon);
        nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
        paginationControls.appendChild(nextBtn);
    }
    
    // Adicionar controles ao container
    container.appendChild(paginationControls);
}
