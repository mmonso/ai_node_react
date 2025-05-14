const axios = require('axios');
require('dotenv').config();

// Obtém as variáveis de ambiente
const apiKey = process.env.GOOGLE_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Verifica se as variáveis estão definidas
if (!apiKey || !searchEngineId) {
  console.error('Erro: GOOGLE_API_KEY ou GOOGLE_SEARCH_ENGINE_ID não estão definidas no arquivo .env');
  console.log('Certifique-se de criar um arquivo .env com essas variáveis.');
  process.exit(1);
}

// Função para testar a busca
async function testSearch(query) {
  console.log(`Realizando busca para: "${query}"`);
  
  try {
    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: 3 // Limitando a 3 resultados para o teste
    };
    
    console.log('Parâmetros da busca:', { 
      ...params, 
      key: apiKey.substring(0, 5) + '...' // Oculta a maior parte da chave por segurança
    });
    
    const response = await axios.get(url, { params });
    
    if (response.data && response.data.items && response.data.items.length > 0) {
      console.log('\n✅ Busca bem-sucedida!');
      console.log(`Encontrados ${response.data.items.length} resultados:`);
      
      response.data.items.forEach((item, index) => {
        console.log(`\n[${index + 1}] ${item.title}`);
        console.log(`Link: ${item.link}`);
        console.log(`Descrição: ${item.snippet}`);
      });
    } else {
      console.error('\n❌ Nenhum resultado encontrado ou formato de resposta inesperado');
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Erro ao realizar busca:', error.message);
    
    if (error.response) {
      console.error('Detalhes do erro:');
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Execute o teste com uma consulta simples
testSearch('notícias atuais'); 