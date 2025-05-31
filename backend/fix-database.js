const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'data', 'chat.sqlite');
console.log(`Conectando ao banco de dados: ${dbPath}`);

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite.');
});

// Executar a query para criar a tabela config
db.serialize(() => {
  // Verificar se a tabela existe
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='config'", (err, row) => {
    if (err) {
      console.error('Erro ao verificar se a tabela existe:', err.message);
      closeDb();
      return;
    }
    
    if (!row) {
      console.log('Tabela config não encontrada. Criando tabela...');
      
      // Criar a tabela config
      db.run(`
        CREATE TABLE "config" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "systemPrompt" text NOT NULL,
          "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela config:', err.message);
        } else {
          console.log('Tabela config criada com sucesso.');
          
          // Inserir um valor padrão
          db.run(`
            INSERT INTO "config" ("systemPrompt") 
            VALUES ('Você é um assistente prestativo.')
          `, (err) => {
            if (err) {
              console.error('Erro ao inserir prompt padrão:', err.message);
            } else {
              console.log('Prompt padrão inserido com sucesso.');
            }
            closeDb();
          });
        }
      });
    } else {
      console.log('Tabela config já existe.');
      closeDb();
    }
  });
});

function closeDb() {
  // Fechar a conexão
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar o banco de dados:', err.message);
    } else {
      console.log('Conexão com o banco de dados fechada.');
    }
  });
}
