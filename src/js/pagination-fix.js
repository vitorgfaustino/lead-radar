/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Solução de paginação para o Busca Empresas
 * Garante que os resultados sejam exibidos em páginas de 21 itens
 */

// Estado global de paginação
window.paginationState = {
    listPage: 1,
    gridPage: 1
};

function escapeHtml(value) {
    if (value == null) return '';

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeExternalUrl(value) {
    if (!value || value === 'Não disponível') return '';

    const normalizedValue = /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`;

    try {
        const parsedUrl = new URL(normalizedValue);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
            ? parsedUrl.href
            : '';
    } catch (e) {
        return '';
    }
}

function safeImageSrc(value) {
    if (!value) return '/assets/images/no-image.webp';

    if (value.startsWith('/')) {
        return value;
    }

    return safeExternalUrl(value) || '/assets/images/no-image.webp';
}

// Função segura para verificar se um item está na lista de prospectados
function isProspected(placeId) {
    try {
        // Garantir que prospectedPlaces existe no escopo global
        if (!window.prospectedPlaces) {
            window.prospectedPlaces = StorageManager.readStoredSet('prospectedPlaces', []);
        }
        
        // Verificar se prospectedPlaces é um Set com método has
        if (window.prospectedPlaces && typeof window.prospectedPlaces.has === 'function') {
            return window.prospectedPlaces.has(placeId);
        }
        return false;
    } catch (e) {
        console.error('Erro ao verificar item prospectado:', e);
        return false;
    }
}

// Função para exibir resultados em lista com paginação
function exibirResultadosListaPaginado(results) {
    const resultsList = document.getElementById('listView');
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-state-icon';
        const icon = document.createElement('i');
        icon.className = 'fas fa-building';
        emptyIcon.appendChild(icon);
        const title = document.createElement('h3');
        title.className = 'text-lg font-medium text-gray-300';
        title.textContent = 'Nenhum resultado encontrado';
        const description = document.createElement('p');
        description.className = 'text-gray-500 mt-1';
        description.textContent = 'Tente ajustar seus critérios de pesquisa';
        emptyState.append(emptyIcon, title, description);
        resultsList.replaceChildren(emptyState);
        return;
    }
    
    // Constantes para paginação
    const itemsPerPage = 21;
    const totalPages = Math.ceil(results.length / itemsPerPage);
    
    // Garantir que a página atual seja válida
    if (window.paginationState.listPage > totalPages) {
        window.paginationState.listPage = 1;
    }
    
    // Calcular índices para a página atual
    const startIndex = (window.paginationState.listPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, results.length);
    
    // Obter apenas os resultados para esta página
    const pageResults = results.slice(startIndex, endIndex);
    
    // Renderizar os resultados da página atual
    pageResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        const safeName = escapeHtml(result.nome || 'Não disponível');
        const safeAddress = escapeHtml(result.endereco || 'Não disponível');
        const safePhone = escapeHtml(result.telefone || 'Não disponível');
        const safeWebsiteText = escapeHtml(result.website || 'Não disponível');
        const safeRating = escapeHtml(result.avaliacao || '');
        const safeReviewCount = escapeHtml(result.totalAvaliacoes || '');
        const safePlaceId = escapeHtml(result.placeId || '');
        const websiteHref = safeExternalUrl(result.website);
        const photoSrc = safeImageSrc(result.foto);
        resultItem.className = `result-item p-4 hover:bg-gray-700 transition-colors duration-200 ${
            isProspected(result.placeId) ? 'prospected-item' : ''
        }`;
        
        // Badge para itens prospectados
        const prospectedBadge = isProspected(result.placeId) 
            ? '<div class="prospected-badge"><i class="fas fa-check-circle"></i> Empresa Prospectada</div>'
            : '';
        
        resultItem.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                ${result.foto ? `
                    <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src="${photoSrc}" alt="${safeName}" class="w-full h-full object-cover">
                    </div>
                ` : ''}
                <div class="flex-1 min-w-0">
                    ${prospectedBadge}
                    <h3 class="text-lg font-semibold text-white truncate mt-2">${safeName}</h3>
                    <p class="text-gray-400 text-sm">${safeAddress}</p>
                    <div class="mt-3 flex flex-wrap gap-6">
                        <div class="flex items-center text-sm">
                            <i class="fas fa-phone text-gray-400 mr-2"></i>
                            <span class="text-gray-200">${safePhone}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <i class="fas fa-globe text-gray-400 mr-2"></i>
                            ${websiteHref ? 
                                `<a href="${websiteHref}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline flex items-center">
                                    Visitar Website
                                    <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                                </a>` : 
                                '<span class="text-gray-400">Website não disponível</span>'}
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    ${result.avaliacao !== 'Não avaliado' ? 
                        `<div class="flex items-center">
                            <span class="text-yellow-300 font-medium mr-1">${safeRating}</span>
                            <i class="fas fa-star text-yellow-300 text-xs"></i>
                            ${result.totalAvaliacoes !== 'N/A' ? 
                                `<span class="text-gray-400 text-xs ml-1">(${safeReviewCount})</span>` : ''}
                        </div>` : ''}
                    <div class="flex items-center gap-2">
                        <button class="btn-secondary px-3 py-1 rounded-lg text-sm view-details-btn" data-index="${startIndex + index}">
                            <i class="fas fa-eye mr-1"></i> Mais Detalhes
                        </button>
                        <div class="prospected-badge ${isProspected(result.placeId) ? 'prospected' : ''}" data-place-id="${safePlaceId}">
                            <i class="fas fa-check-circle"></i>
                            <span>${isProspected(result.placeId) ? 'Prospectado' : 'Não Prospectado'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsList.appendChild(resultItem);
    });
    
    // Adicionar controles de paginação se houver mais de uma página
    if (totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination flex justify-center items-center gap-2 mt-4 mb-4 p-2 bg-gray-800 rounded';
        
        // Informação da página atual
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-gray-300 text-sm mr-2';
        pageInfo.textContent = `Página ${window.paginationState.listPage} de ${totalPages}`;
        paginationDiv.appendChild(pageInfo);
        
        // Botão anterior
        if (window.paginationState.listPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
            const prevIcon = document.createElement('i');
            prevIcon.className = 'fas fa-chevron-left';
            prevBtn.appendChild(prevIcon);
            prevBtn.addEventListener('click', function() {
                window.paginationState.listPage--;
                exibirResultadosListaPaginado(results);
            });
            paginationDiv.appendChild(prevBtn);
        }
        
        // Botões de página (máximo 5)
        const maxButtons = 5;
        let startPage = Math.max(1, window.paginationState.listPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn px-3 py-1 rounded ${i === window.paginationState.listPage ? 'bg-accent text-white' : 'bg-gray-700 text-gray-300'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', function() {
                window.paginationState.listPage = i;
                exibirResultadosListaPaginado(results);
            });
            paginationDiv.appendChild(pageBtn);
        }
        
        // Botão próximo
        if (window.paginationState.listPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
            const nextIcon = document.createElement('i');
            nextIcon.className = 'fas fa-chevron-right';
            nextBtn.appendChild(nextIcon);
            nextBtn.addEventListener('click', function() {
                window.paginationState.listPage++;
                exibirResultadosListaPaginado(results);
            });
            paginationDiv.appendChild(nextBtn);
        }
        
        resultsList.appendChild(paginationDiv);
    }
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            mostrarDetalhes(results[index]);
        });
    });
}

// Função para exibir resultados em grid com paginação
function exibirResultadosGridPaginado(results) {
    const gridView = document.getElementById('gridView');
    gridView.innerHTML = '';
    
    // Garantir que o gridView tenha o estilo correto
    gridView.className = 'grid-view';
    gridView.style.display = 'grid';
    gridView.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    gridView.style.gap = '1rem';
    gridView.style.padding = '1rem';
    
    if (results.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'col-span-full empty-state';
        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-state-icon';
        const icon = document.createElement('i');
        icon.className = 'fas fa-building';
        emptyIcon.appendChild(icon);
        const title = document.createElement('h3');
        title.className = 'text-lg font-medium text-gray-300';
        title.textContent = 'Nenhum resultado encontrado';
        const description = document.createElement('p');
        description.className = 'text-gray-500 mt-1';
        description.textContent = 'Tente ajustar seus critérios de pesquisa';
        emptyState.append(emptyIcon, title, description);
        gridView.replaceChildren(emptyState);
        return;
    }
    
    // Constantes para paginação
    const itemsPerPage = 21;
    const totalPages = Math.ceil(results.length / itemsPerPage);
    
    // Garantir que a página atual seja válida
    if (window.paginationState.gridPage > totalPages) {
        window.paginationState.gridPage = 1;
    }
    
    // Calcular índices para a página atual
    const startIndex = (window.paginationState.gridPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, results.length);
    
    // Obter apenas os resultados para esta página
    const pageResults = results.slice(startIndex, endIndex);
    
    // Renderizar os resultados da página atual
    pageResults.forEach((result, index) => {
        const resultCard = document.createElement('div');
        const safeName = escapeHtml(result.nome || 'Não disponível');
        const safeAddress = escapeHtml(result.endereco || 'Não disponível');
        const safePhone = escapeHtml(result.telefone || 'Não disponível');
        const safeRating = escapeHtml(result.avaliacao || '');
        const safePlaceId = escapeHtml(result.placeId || '');
        const websiteHref = safeExternalUrl(result.website);
        const photoSrc = safeImageSrc(result.foto);
        resultCard.className = `grid-card transition-all duration-300 hover:shadow-lg ${
            isProspected(result.placeId) ? 'prospected-item' : ''
        }`;
        
        resultCard.innerHTML = `
            <div class="grid-card-header relative">
                ${result.foto ? `
                    <div class="w-full h-40 rounded-t-lg overflow-hidden">
                        <img src="${photoSrc}" alt="${safeName}" class="w-full h-full object-cover">
                    </div>
                ` : ''}
                <h3 class="text-lg font-semibold text-white truncate mt-2">${safeName}</h3>
                ${result.avaliacao !== 'Não avaliado' ? 
                `<div class="flex items-center bg-gray-800 px-2 py-1 rounded-full mt-2 w-fit">
                    <span class="text-yellow-300 text-sm mr-1">${safeRating}</span>
                    <i class="fas fa-star text-yellow-300 text-xs"></i>
                </div>` : ''}
            </div>
            <div class="grid-card-body">
                <div class="mb-3">
                    <div class="text-gray-400 text-xs mb-1 font-bold">ENDEREÇO</div>
                    <p class="text-sm text-gray-200">${safeAddress}</p>
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <div>
                        <div class="text-gray-400 text-xs mb-1 font-bold">TELEFONE</div>
                        <p class="text-sm text-gray-200">${safePhone}</p>
                    </div>
                    <div>
                        <div class="text-gray-400 text-xs mb-1 font-bold">WEBSITE</div>
                        ${websiteHref ? 
                            `<a href="${websiteHref}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline text-sm flex items-center">
                                Visitar
                                <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                            </a>` : 
                            '<p class="text-sm text-gray-400">Não disponível</p>'}
                    </div>
                </div>
            </div>
            <div class="grid-card-footer flex justify-between items-center gap-2">
                <button class="text-xs btn-secondary px-2 py-1 rounded view-details-btn" data-index="${startIndex + index}">
                    <i class="fas fa-eye mr-1"></i> Detalhes
                </button>
                <div class="prospected-badge ${isProspected(result.placeId) ? 'prospected' : ''}" data-place-id="${safePlaceId}">
                    <i class="fas fa-check-circle"></i>
                    <span class="text-xs">${isProspected(result.placeId) ? 'Prospectado' : 'Não Prospectado'}</span>
                </div>
            </div>
        `;
        
        gridView.appendChild(resultCard);
    });
    
    // Adicionar controles de paginação se houver mais de uma página
    if (totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination flex justify-center items-center gap-2 mt-4 mb-4 p-2 bg-gray-800 rounded col-span-full';
        
        // Informação da página atual
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-gray-300 text-sm mr-2';
        pageInfo.textContent = `Página ${window.paginationState.gridPage} de ${totalPages}`;
        paginationDiv.appendChild(pageInfo);
        
        // Botão anterior
        if (window.paginationState.gridPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
            const prevIcon = document.createElement('i');
            prevIcon.className = 'fas fa-chevron-left';
            prevBtn.appendChild(prevIcon);
            prevBtn.addEventListener('click', function() {
                window.paginationState.gridPage--;
                exibirResultadosGridPaginado(results);
            });
            paginationDiv.appendChild(prevBtn);
        }
        
        // Botões de página (máximo 5)
        const maxButtons = 5;
        let startPage = Math.max(1, window.paginationState.gridPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn px-3 py-1 rounded ${i === window.paginationState.gridPage ? 'bg-accent text-white' : 'bg-gray-700 text-gray-300'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', function() {
                window.paginationState.gridPage = i;
                exibirResultadosGridPaginado(results);
            });
            paginationDiv.appendChild(pageBtn);
        }
        
        // Botão próximo
        if (window.paginationState.gridPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn px-3 py-1 rounded bg-gray-700 text-gray-300';
            const nextIcon = document.createElement('i');
            nextIcon.className = 'fas fa-chevron-right';
            nextBtn.appendChild(nextIcon);
            nextBtn.addEventListener('click', function() {
                window.paginationState.gridPage++;
                exibirResultadosGridPaginado(results);
            });
            paginationDiv.appendChild(nextBtn);
        }
        
        gridView.appendChild(paginationDiv);
    }
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            mostrarDetalhes(results[index]);
        });
    });
}

// Função para atualizar a exibição quando o status de prospectado mudar
function atualizarExibicaoProspectado(placeId, isProspected) {
    // Atualizar na visualização de lista
    const listItems = document.querySelectorAll(`#listView .prospected-badge[data-place-id="${placeId}"]`);
    listItems.forEach(badge => {
        badge.classList.toggle('prospected', isProspected);
        const span = badge.querySelector('span');
        if (span) {
            span.textContent = isProspected ? 'Prospectado' : 'Não Prospectado';
        }

        // Atualizar a classe do item pai para destacar visualmente
        const parentItem = badge.closest('.result-item');
        if (parentItem) {
            parentItem.classList.toggle('prospected-item', isProspected);
        }
    });

    // Atualizar na visualização em grid
    const gridItems = document.querySelectorAll(`#gridView .prospected-badge[data-place-id="${placeId}"]`);
    gridItems.forEach(badge => {
        badge.classList.toggle('prospected', isProspected);
        const span = badge.querySelector('span');
        if (span) {
            span.textContent = isProspected ? 'Prospectado' : 'Não Prospectado';
        }

        // Atualizar a classe do item pai para destacar visualmente
        const parentItem = badge.closest('.result-item');
        if (parentItem) {
            parentItem.classList.toggle('prospected-item', isProspected);
        }
    });
}

// Ouvir eventos de mudança de status de prospectado
document.addEventListener('prospectedStatusChanged', function(e) {
    const { placeId, isProspected } = e.detail;
    atualizarExibicaoProspectado(placeId, isProspected);
});

// Substituir as funções originais quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar prospectedPlaces se não existir
    if (!window.prospectedPlaces) {
        const savedProspected = StorageManager.readStoredValue('prospectedPlaces', '[]');
        window.prospectedPlaces = new Set(savedProspected ? JSON.parse(savedProspected) : []);
    }

    // Aguardar um pequeno tempo para garantir que todas as outras variáveis estejam definidas
    setTimeout(function() {

        // Guardar referências às funções originais
        const originalExibirResultadosLista = window.exibirResultadosLista;
        const originalExibirResultadosGrid = window.exibirResultadosGrid;

        // Substituir com as versões paginadas
        window.exibirResultadosLista = function(results) {
            exibirResultadosListaPaginado(results);
        };

        window.exibirResultadosGrid = function(results) {
            exibirResultadosGridPaginado(results);
        };

        console.log('Paginação instalada com sucesso!');
    }, 500); // Esperar 500ms para garantir que tudo esteja carregado
});
