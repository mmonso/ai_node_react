const fs = require('fs');
const path = require('path');

// --- Configurações ---
const TARGET_DIRECTORY = '.'; // Diretório para escanear (raiz do projeto)
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'uploads', 'migrations', 'build', 'frontend/node_modules', 'backend/node_modules', 'frontend/build']; // Pastas a serem ignoradas
const IGNORED_EXTENSIONS = ['.lock', '.log', '.map']; // Extensões de arquivo a serem ignoradas
const IGNORED_FILES = ['package-lock.json', 'yarn.lock']; // Arquivos específicos a serem ignorados
const NUMBER_OF_FILES_TO_SHOW = 15; // Quantos dos maiores arquivos mostrar
const MIN_FILE_SIZE_KB = 5; // Tamanho mínimo em KB para considerar um arquivo (opcional, para filtrar ruído)
// --------------------

function getFileStatsRecursively(dir, allFiles = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (IGNORED_DIRS.includes(file) || IGNORED_FILES.includes(file)) {
        return; // Pula diretórios/arquivos ignorados
      }

      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          getFileStatsRecursively(filePath, allFiles);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (IGNORED_EXTENSIONS.includes(ext)) {
            return; // Pula extensões ignoradas
          }
          if (stat.size >= MIN_FILE_SIZE_KB * 1024) {
            allFiles.push({ path: filePath, size: stat.size });
          }
        }
      } catch (error) {
        // console.warn(`Aviso: Não foi possível ler o status de ${filePath}: ${error.message}`);
        // Ignora arquivos/pastas que não podem ser acessados (ex: links simbólicos quebrados)
      }
    });
  } catch (error) {
    console.error(`Erro ao ler o diretório ${dir}: ${error.message}`);
  }
  return allFiles;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

console.log(`Procurando arquivos grandes em: ${path.resolve(TARGET_DIRECTORY)}`);
console.log(`Ignorando diretórios: ${IGNORED_DIRS.join(', ')}`);
console.log(`Ignorando extensões: ${IGNORED_EXTENSIONS.join(', ')}`);
console.log(`Ignorando arquivos: ${IGNORED_FILES.join(', ')}`);
console.log(`Mostrando os ${NUMBER_OF_FILES_TO_SHOW} maiores arquivos (mínimo ${MIN_FILE_SIZE_KB} KB):\n`);

const allFiles = getFileStatsRecursively(TARGET_DIRECTORY);

if (allFiles.length === 0) {
  console.log('Nenhum arquivo encontrado (ou todos abaixo do tamanho mínimo).');
} else {
  allFiles.sort((a, b) => b.size - a.size); // Ordena por tamanho, do maior para o menor

  const largestFiles = allFiles.slice(0, NUMBER_OF_FILES_TO_SHOW);

  largestFiles.forEach(file => {
    console.log(`${formatBytes(file.size)}\t${file.path}`);
  });

  if (allFiles.length > NUMBER_OF_FILES_TO_SHOW) {
    console.log(`\n... e mais ${allFiles.length - NUMBER_OF_FILES_TO_SHOW} outro(s) arquivo(s) acima de ${MIN_FILE_SIZE_KB} KB.`);
  }
}