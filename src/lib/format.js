export const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtData = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
export const fmtDataHora = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtHora = (ms) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const pad = (n) => String(n).padStart(2, '0');

export function fmtRestante(ms) {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const core = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return neg ? `−${core}` : core;
}

export function fmtHorasCurto(ms) {
  const h = Math.abs(ms) / 3600e3;
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${Math.floor(h)}h${pad(Math.round((h % 1) * 60))}`;
  return `${Math.round(h / 24)} dias`;
}

export function iniciais(nome = '') {
  const ws = nome.replace(/\(.*\)/, '').split(/\s+/).filter((w) => w.length > 2);
  return ((ws[0]?.[0] || '') + (ws[ws.length - 1]?.[0] || '')).toUpperCase();
}

export function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

export function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Destaca o último dígito do nº sequencial (base da regra Par/Ímpar). */
export function partesNumero(numero = '') {
  return { antes: numero.slice(0, 6), digito: numero.slice(6, 7), depois: numero.slice(7) };
}
