import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_FILE = path.join(__dirname, 'public', 'version.json');
const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');
const APK_NAME = 'monely-latest.apk';
const APK_PATH = path.join(DOWNLOADS_DIR, APK_NAME);

// Configuração básica - altere conforme necessário
const BASE_URL = 'https://monelyfinance.vercel.app'; // URL do seu deploy na Vercel

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function updateVersion() {
  try {
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    
    // Incrementar versão (ex: 1.0.2 -> 1.0.3)
    const versionParts = versionData.version.split('.').map(Number);
    versionParts[2] += 1;
    const newVersion = versionParts.join('.');
    
    const hash = getFileHash(APK_PATH);
    
    if (!hash) {
      console.warn('⚠️  Aviso: APK não encontrado em public/downloads/monely-latest.apk');
      console.warn('O hash não será atualizado.');
    }

    const newVersionData = {
      version: newVersion,
      url: `${BASE_URL}/downloads/${APK_NAME}`,
      hash: hash,
      releaseNotes: `Nova atualização v${newVersion}. Melhorias de estabilidade e performance.`
    };

    fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersionData, null, 2));
    
    console.log(`✅ version.json atualizado para v${newVersion}`);
    console.log(`🔗 URL: ${newVersionData.url}`);
    console.log(`🔒 Hash: ${hash || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar version.json:', error);
  }
}

updateVersion();
