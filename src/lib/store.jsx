import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ANALISTAS, gerarEstadoBase } from './mockData';
import { DEFAULT_CONFIG, enriquecer, escolherAnalista, equipeDoNumero } from './rules';

const KEY = 'pjeplus:v1';
const clone = (x) => JSON.parse(JSON.stringify(x));
const agoraISO = () => new Date().toISOString();
let seq = 0;
const nid = (p = 'n') => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

export function criarEstado() {
  const { fila, acervo } = gerarEstadoBase(Date.now());
  const analistas = clone(ANALISTAS);
  const ordenada = [...fila].sort((a, b) => new Date(a.autuadoEm) - new Date(b.autuadoEm));
  const processos = [];
  for (const p of ordenada) {
    const a = escolherAnalista(p.numero, analistas, processos, DEFAULT_CONFIG);
    processos.push({
      ...p,
      analistaId: a?.id ?? null,
      historicoEventos: [
        ...p.historicoEventos,
        { em: p.autuadoEm, texto: `Distribuído automaticamente (Equipe ${equipeDoNumero(p.numero) === 'par' ? 'Par' : 'Ímpar'}) para ${a?.nome}` },
      ],
    });
  }
  return { processos, acervo, analistas, config: clone(DEFAULT_CONFIG), notificacoes: [], ingestoes: [], loteIdx: 0, tema: 'light' };
}

function carregar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignora */
  }
  return criarEstado();
}

const evento = (p, texto) => ({ ...p, historicoEventos: [...(p.historicoEventos || []), { em: agoraISO(), texto }] });

function reducer(s, a) {
  const upd = (id, fn) => ({ ...s, processos: s.processos.map((p) => (p.id === id ? fn(p) : p)) });
  switch (a.type) {
    case 'INGERIR':
      return {
        ...s,
        processos: [...s.processos, ...a.processos],
        notificacoes: [...a.notificacoes, ...s.notificacoes].slice(0, 80),
        ingestoes: [a.ingestao, ...s.ingestoes],
        loteIdx: s.loteIdx + (a.contaLote ? 1 : 0),
      };
    case 'MOVER': {
      const rot = { triagem: 'A analisar', analise: 'Em análise', minuta: 'Minuta / Assinatura', concluido: 'Concluído' };
      return upd(a.id, (p) =>
        p.status === a.status
          ? p
          : evento({ ...p, status: a.status, statusDesde: agoraISO(), concluidoEm: a.status === 'concluido' ? agoraISO() : null }, `Movido para "${rot[a.status]}"`),
      );
    }
    case 'ATRIBUIR': {
      const an = s.analistas.find((x) => x.id === a.analistaId);
      return upd(a.id, (p) => evento({ ...p, analistaId: a.analistaId }, `Redistribuído manualmente para ${an?.nome}`));
    }
    case 'CORRIGIR':
      return upd(a.id, (p) => evento({ ...p, cadastroCorrigido: true }, 'Pendências de cadastro marcadas como regularizadas'));
    case 'EMENDA':
      return {
        ...upd(a.id, (p) => evento({ ...p, emendaSolicitada: true }, 'Intimação para emenda da inicial expedida (art. 321 do CPC)')),
        notificacoes: [a.notificacao, ...s.notificacoes],
      };
    case 'MINUTA':
      return upd(a.id, (p) => evento({ ...p, minuta: { texto: a.texto, modelo: a.modelo, em: agoraISO() } }, `Minuta preliminar gerada por IA (${a.modelo})`));
    case 'NOTIFICAR':
      return { ...s, notificacoes: [...a.notificacoes, ...s.notificacoes].slice(0, 80) };
    case 'LER_TODAS':
      return { ...s, notificacoes: s.notificacoes.map((n) => ({ ...n, lida: true })) };
    case 'CONFIG':
      return { ...s, config: { ...s.config, ...a.patch, sla: { ...s.config.sla, ...(a.patch.sla || {}) }, canais: { ...s.config.canais, ...(a.patch.canais || {}) } } };
    case 'ANALISTA':
      return { ...s, analistas: s.analistas.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) };
    case 'TEMA':
      return { ...s, tema: s.tema === 'dark' ? 'light' : 'dark' };
    case 'RESET':
      return { ...criarEstado(), tema: s.tema };
    default:
      return s;
  }
}

/** Pipeline de ingestão: valida → detecta urgência → distribui → notifica. */
export function processarLote(state, novos) {
  const cfg = state.config;
  const atuais = [...state.processos];
  const resultados = [];
  const notificacoes = [];
  const agora = agoraISO();
  for (const p0 of novos) {
    const analista = escolherAnalista(p0.numero, state.analistas, atuais, cfg);
    const pre = enriquecer(p0, cfg);
    const equipe = equipeDoNumero(p0.numero);
    const regra = cfg.modo === 'par_impar' ? `Equipe ${equipe === 'par' ? 'Par' : 'Ímpar'}` : 'Round-robin balanceado';
    const p = {
      ...p0,
      analistaId: analista?.id ?? null,
      status: 'triagem',
      statusDesde: agora,
      historicoEventos: [
        ...p0.historicoEventos,
        { em: agora, texto: pre.pendencias.length ? `Validação automática: ${pre.pendencias.length} pendência(s) de cadastro destacadas` : 'Validação automática: cadastro OK' },
        ...(pre.urgencia ? [{ em: agora, texto: `Urgência detectada: ${pre.urgencia.label} — SLA ${pre.urgencia.horas}h` }] : []),
        { em: agora, texto: `Distribuído automaticamente (${regra}) para ${analista?.nome ?? '—'}` },
      ],
    };
    atuais.push(p);
    resultados.push({ processo: enriquecer(p, cfg), analista, regra });
    if (pre.urgencia && analista) {
      const base = { processoId: p.id, analistaId: analista.id, em: agora, lida: false, nivel: pre.urgencia.nivel };
      if (cfg.canais.teams)
        notificacoes.push({ ...base, id: nid(), canal: 'teams', titulo: `${pre.urgencia.label} · SLA ${pre.urgencia.horas}h`, corpo: `Processo ${p.numero} (${p.classe}) foi atribuído a ${analista.nome}.` });
      if (cfg.canais.email)
        notificacoes.push({ ...base, id: nid(), canal: 'email', titulo: `[PJe+] Urgência atribuída: ${p.numero}`, corpo: `E-mail enviado para ${analista.email}` });
    }
  }
  return { resultados, notificacoes, processos: resultados.map((r) => {
    const { pendencias, urgencia, ...raw } = r.processo;
    return raw;
  }) };
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, carregar);
  const [pagina, setPagina] = useState('painel');
  const [abertoId, setAbertoId] = useState(null);
  const [abaDrawer, setAbaDrawer] = useState('dados');
  const [ingestAberto, setIngestAberto] = useState(false);
  const [dossieAlvo, setDossieAlvo] = useState(null);
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.tema;
  }, [state.tema]);

  const processos = useMemo(() => state.processos.map((p) => enriquecer(p, state.config)), [state.processos, state.config]);
  const acervo = useMemo(() => state.acervo.map((p) => ({ ...p, pendencias: [], urgencia: null })), [state.acervo]);
  const todos = useMemo(() => [...processos, ...acervo], [processos, acervo]);
  const analistaPorId = useMemo(() => Object.fromEntries(state.analistas.map((a) => [a.id, a])), [state.analistas]);

  const fecharToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const toast = useCallback(
    (t) => {
      const id = nid('t');
      setToasts((xs) => [...xs, { ...t, id }].slice(-4));
      timers.current[id] = setTimeout(() => fecharToast(id), t.duracao ?? (t.tipo === 'teams' ? 9000 : 5000));
    },
    [fecharToast],
  );

  const abrirProcesso = useCallback((id, aba = 'dados') => {
    setAbaDrawer(aba);
    setAbertoId(id);
  }, []);

  const abrirDossie = useCallback((chave) => {
    setDossieAlvo(chave);
    setAbertoId(null);
    setPagina('dossie');
  }, []);

  const value = {
    state, dispatch, processos, acervo, todos, analistaPorId,
    pagina, setPagina,
    abertoId, abrirProcesso, fecharProcesso: () => setAbertoId(null), abaDrawer, setAbaDrawer,
    ingestAberto, setIngestAberto,
    dossieAlvo, setDossieAlvo, abrirDossie,
    toasts, toast, fecharToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}
