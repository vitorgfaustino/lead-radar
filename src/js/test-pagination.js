/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

/**
 * Script para testar a paginação
 * Gera resultados de teste e exibe na interface
 */

function gerarResultadosTeste(quantidade = 100) {
    console.log(`Gerando ${quantidade} resultados de teste...`);
    
    const resultados = [];
    
    for (let i = 1; i <= quantidade; i++) {
        resultados.push({
            placeId: `place_id_${i}`,
            nome: `Empresa de Teste ${i}`,
            endereco: `Rua Teste, ${i}, São Paulo - SP`,
            telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            website: i % 3 === 0 ? `https://empresa${i}.com.br` : 'Não disponível',
            avaliacao: (Math.random() * 5).toFixed(1),
            totalAvaliacoes: Math.floor(Math.random() * 1000),
            foto: i % 2 === 0 ? 'https://via.placeholder.com/150' : null
        });
    }
    
    console.log('Resultados gerados com sucesso!');
    return resultados;
}

// Função para testar a paginação
function testarPaginacao() {
    console.log('Iniciando teste de paginação...');
    
    // Gerar 100 resultados de teste
    const resultados = gerarResultadosTeste(100);
    
    // Salvar na variável global
    window.allResults = resultados;
    
    // Exibir na visualização atual
    if (window.currentView === 'grid') {
        window.exibirResultadosGrid(resultados);
    } else {
        window.exibirResultadosLista(resultados);
    }
    
    console.log('Teste de paginação concluído! Verifique se estão sendo exibidos 21 resultados por página.');
}

// Executar o teste quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de teste de paginação carregado!');
    
    // Adicionar botão de teste na interface
    const btnContainer = document.createElement('div');
    btnContainer.className = 'fixed bottom-4 right-4 z-50';
    
    const testBtn = document.createElement('button');
    testBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg';
    testBtn.textContent = 'Testar Paginação';
    testBtn.onclick = testarPaginacao;
    
    btnContainer.appendChild(testBtn);
    document.body.appendChild(btnContainer);
});
