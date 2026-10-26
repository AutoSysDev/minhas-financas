import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';

// URL onde o arquivo version.json estará hospedado.
// Substitua pela URL real do seu servidor/bucket em produção.
// Para testes locais com Live Reload, use o IP da sua máquina.
// const UPDATE_URL = 'http://192.168.2.14:3000/version.json';
const UPDATE_URL = 'https://monelyfinance.vercel.app/version.json';

interface UpdateInfo {
  version: string;
  url: string;
  hash?: string;
  releaseNotes?: string;
}

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Helper para verificar integridade do arquivo
  const verifyIntegrity = async (blob: Blob, expectedHash: string) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return actualHash === expectedHash;
    } catch (e) {
      console.error('Erro ao verificar integridade:', e);
      return false;
    }
  };

  // Compara versões semânticas (ex: 1.0.0 vs 1.0.1)
  const isNewerVersion = (current: string, remote: string) => {
    const c = current.split('.').map(Number);
    const r = remote.split('.').map(Number);
    for (let i = 0; i < Math.max(c.length, r.length); i++) {
      const cv = c[i] || 0;
      const rv = r[i] || 0;
      if (rv > cv) return true;
      if (rv < cv) return false;
    }
    return false;
  };

  const checkUpdate = async () => {
    // Se estiver no navegador, não faz nada
    if (!Capacitor.isNativePlatform()) return;

    try {
      const appInfo = await App.getInfo();
      const currentVersion = appInfo.version;

      const response = await fetch(`${UPDATE_URL}?t=${Date.now()}`);
      if (!response.ok) return;

      const remoteInfo: UpdateInfo = await response.json();

      if (isNewerVersion(currentVersion, remoteInfo.version)) {
        setUpdateInfo(remoteInfo);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('Erro ao verificar atualização:', error);
    }
  };

  const performUpdate = async () => {
    if (!updateInfo) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      // Usando fetch com progresso via ReadableStream
      const response = await fetch(updateInfo.url);
      if (!response.ok) throw new Error('Falha no download');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream não suportado');

      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          }
        }
      }

      const blob = new Blob(chunks);

      // 1.1 Verificar Integridade se houver hash
      if (updateInfo.hash) {
        const isValid = await verifyIntegrity(blob, updateInfo.hash);
        if (!isValid) {
          throw new Error('Falha na verificação de integridade: Hash não confere.');
        }
      }

      // Converter para Base64 para salvar via Filesystem
      const readerB64 = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        readerB64.onloadend = () => {
          const result = readerB64.result as string;
          resolve(result.split(',')[1]); // Remove o prefixo data:application/...;base64,
        };
        readerB64.onerror = reject;
      });
      readerB64.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const fileName = `update-${updateInfo.version}.apk`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      // 2. Abrir/Instalar APK
      await FileOpener.open({
        filePath: savedFile.uri,
        contentType: 'application/vnd.android.package-archive'
      });

    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      alert(error.message || 'Erro ao baixar a atualização. Tente novamente.');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  useEffect(() => {
    checkUpdate();
    // Checar periodicamente ou apenas ao montar? Ao montar é suficiente.
  }, []);

  return {
    updateAvailable,
    updateInfo,
    downloading,
    downloadProgress,
    checkUpdate,
    performUpdate
  };
};
