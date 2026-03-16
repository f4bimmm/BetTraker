const fs = require('fs').promises;
const { join } = require('path');
const os = require('os');

const TOKEN = process.env.PIX_TOKEN || 'betraker123';
const STORAGE_FILE = join(os.tmpdir(), 'betraker_pix.json');

async function lerPix() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch(e) {
    return [];
  }
}

async function salvarPix(lista) {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(lista));
  } catch(e) {}
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { token, valor, destinatario, data, descricao } = req.body;
    if (token !== TOKEN) return res.status(401).json({ error: 'Token inválido' });
    if (!valor || valor <= 0) return res.status(400).json({ error: 'Valor inválido' });

    const lista = await lerPix();
    lista.unshift({
      id:           Date.now().toString(),
      valor:        Number(valor),
      destinatario: destinatario || '',
      data:         data || new Date().toISOString().split('T')[0],
      descricao:    descricao || 'PIX via Telegram',
      ts:           Date.now(),
    });
    if (lista.length > 100) lista.splice(100);
    await salvarPix(lista);
    return res.status(200).json({ ok: true, message: 'PIX recebido!' });
  }

  if (req.method === 'GET') {
    const { token, since } = req.query;
    if (token !== TOKEN) return res.status(401).json({ error: 'Token inválido' });
    const desde = Number(since) || 0;
    const lista = await lerPix();
    return res.status(200).json({ pix: lista.filter(p => p.ts > desde) });
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
