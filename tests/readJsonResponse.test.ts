import { describe, it, expect } from 'vitest';
import { readJsonResponse } from '../pages/Login';

function makeResponse(body: string, options: { status?: number; ok?: boolean; contentType?: string } = {}) {
  const status = options.status ?? 200;
  const ok = options.ok ?? (status >= 200 && status < 300);
  const contentType = options.contentType ?? 'application/json; charset=utf-8';
  const headers = { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) } as any;
  return {
    status,
    ok,
    headers,
    text: async () => body,
  } as any;
}

describe('readJsonResponse', () => {
  it('parseia JSON válido quando status ok', async () => {
    const res = makeResponse('{"email":"test@example.com"}');
    const data = await readJsonResponse(res);
    expect(data.email).toBe('test@example.com');
  });

  it('falha quando corpo está vazio', async () => {
    const res = makeResponse('');
    await expect(readJsonResponse(res)).rejects.toThrow('Resposta vazia');
  });

  it('falha quando content-type não é JSON', async () => {
    const res = makeResponse('plain text', { contentType: 'text/plain' });
    await expect(readJsonResponse(res)).rejects.toThrow('Resposta não é JSON');
  });

  it('falha quando JSON é malformado', async () => {
    const res = makeResponse('{invalid}', { contentType: 'application/json' });
    await expect(readJsonResponse(res)).rejects.toThrow('JSON malformado');
  });

  it('retorna mensagem de erro do servidor quando status não ok e corpo JSON', async () => {
    const res = makeResponse('{"error":"Usuário não encontrado"}', { status: 404 });
    await expect(readJsonResponse(res)).rejects.toThrow('Usuário não encontrado');
  });

  it('retorna erro HTTP com texto quando status não ok e corpo não JSON', async () => {
    const res = makeResponse('Not found', { status: 404, contentType: 'text/plain' });
    await expect(readJsonResponse(res)).rejects.toThrow('Erro HTTP 404');
  });
});
