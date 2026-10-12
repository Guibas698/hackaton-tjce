// Validadores oficiais: número único CNJ (Res. 65/2008), CPF, CNPJ, OAB e CEP.

export const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '');

export function cpfValido(cpf) {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
    const r = ((s * 10) % 11) % 10;
    if (r !== Number(d[t])) return false;
  }
  return true;
}

function cnpjDigito(d, len) {
  const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < len; i++) s += Number(d[i]) * w[i];
  const r = s % 11;
  return r < 2 ? 0 : 11 - r;
}

export function cnpjValido(cnpj) {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  return cnpjDigito(d, 12) === Number(d[12]) && cnpjDigito(d, 13) === Number(d[13]);
}

export function gerarCpf(base9) {
  const d = base9.split('').map(Number);
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += d[i] * (t + 1 - i);
    d.push(((s * 10) % 11) % 10);
  }
  const x = d.join('');
  return `${x.slice(0, 3)}.${x.slice(3, 6)}.${x.slice(6, 9)}-${x.slice(9)}`;
}

export function gerarCnpj(base12) {
  let d = base12;
  d += cnpjDigito(d, 12);
  d += cnpjDigito(d, 13);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Dígito verificador do número único CNJ: DD = 98 - (NNNNNNNAAAAJTROOOO00 mod 97) */
export function cnjDV(seq, ano, j, tr, orig) {
  const n = BigInt(`${seq}${ano}${j}${tr}${orig}00`);
  return String(98n - (n % 97n)).padStart(2, '0');
}

const CNJ_RE = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;

export function cnjValido(numero) {
  const m = CNJ_RE.exec(String(numero || '').trim());
  if (!m) return false;
  const [, seq, dv, ano, j, tr, orig] = m;
  return cnjDV(seq, ano, j, tr, orig) === dv;
}

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

/** Formato esperado: "OAB/CE 12.345" (aceita variações com/sem ponto e sufixo A/B/E) */
export function oabValida(oab) {
  const m = /^OAB\/([A-Z]{2})\s?([\d.]{3,8})([-\s]?[ABEN])?$/.exec(String(oab || '').trim().toUpperCase());
  if (!m) return false;
  if (!UFS.includes(m[1])) return false;
  const n = onlyDigits(m[2]);
  return n.length >= 3 && n.length <= 6 && Number(n) > 0;
}

export const cepValido = (cep) => onlyDigits(cep).length === 8 && !/^0+$/.test(onlyDigits(cep));

export function idade(dataNascimento, ref = new Date()) {
  if (!dataNascimento) return null;
  const n = new Date(dataNascimento);
  if (Number.isNaN(n.getTime())) return null;
  let a = ref.getFullYear() - n.getFullYear();
  const m = ref.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) a--;
  return a;
}
