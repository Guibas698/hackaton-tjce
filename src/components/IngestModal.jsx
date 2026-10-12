import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, DownloadCloud, ShieldCheck, Siren, Shuffle, Send, ScanSearch, X, AlertTriangle, PartyPopper } from 'lucide-react';
import { useStore, processarLote } from '../lib/store';
import { proximoLote, VARA } from '../lib/mockData';
import { Avatar, NumeroProc, PendenciaPill, SlaBadge, EquipeTag } from './ui';
import { equipeDoNumero } from '../lib/rules';

const PASSOS = [
  { icone: DownloadCloud, txt: 'Conectando ao PJe (MNI) e lendo novos processos' },
  { icone: ScanSearch, txt: 'Validando cadastros: CNJ, CPF/CNPJ, OAB, TPU, CEP' },
  { icone: Siren, txt: 'Detectando urgências: Réu Preso, Idoso e Tutela' },
  { icone: Shuffle, txt: 'Distribuindo na fila (regra Par/Ímpar)' },
  { icone: Send, txt: 'Notificando analistas no Teams e por e-mail' },
];

function normalizarImportado(lista) {
  const agora = new Date().toISOString();
  return lista.map((x, i) => ({
    id: `imp${Date.now().toString(36)}${i}`,
    vara: VARA,
    valorCausa: 0,
    poloAtivo: [],
    poloPassivo: [],
    ...x,
    autuadoEm: x.autuadoEm || agora,
    origem: 'fila',
    status: 'triagem',
    statusDesde: agora,
    historicoEventos: [{ em: agora, texto: 'Processo importado de lote JSON' }],
  }));
}

export default function IngestModal() {
  const { ingestAberto, setIngestAberto, state, dispatch, toast, analistaPorId, abrirProcesso } = useStore();
  const [passo, setPasso] = useState(-1);
  const [res, setRes] = useState(null);

  const lote = useMemo(() => {
    if (!ingestAberto) return null;
    return Array.isArray(ingestAberto) ? normalizarImportado(ingestAberto) : proximoLote(state.loteIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingestAberto]);

  useEffect(() => {
    if (!lote) return;
    setPasso(0);
    setRes(null);
    const out = processarLote(state, lote);
    const timers = PASSOS.map((_, i) => setTimeout(() => setPasso(i + 1), 750 * (i + 1)));
    timers.push(
      setTimeout(() => {
        setRes(out);
        dispatch({
          type: 'INGERIR',
          processos: out.processos,
          notificacoes: out.notificacoes,
          contaLote: !Array.isArray(ingestAberto),
          ingestao: { id: `i${Date.now()}`, em: new Date().toISOString(), total: out.processos.length, comErro: out.resultados.filter((r) => r.processo.pendencias.length).length, urgentes: out.resultados.filter((r) => r.processo.urgencia).length },
        });
        out.resultados
          .filter((r) => r.processo.urgencia && r.analista && state.config.canais.teams)
          .sort((a, b) => a.processo.urgencia.prazo - b.processo.urgencia.prazo)
          .forEach((r, i) =>
            setTimeout(
              () =>
                toast({
                  tipo: 'teams',
                  nivel: r.processo.urgencia.nivel,
                  analista: r.analista.nome,
                  processoId: r.processo.id,
                  titulo: `🔴 ${r.processo.urgencia.label} — prazo de ${r.processo.urgencia.horas}h`,
                  corpo: `${r.processo.classe} · ${r.processo.numero} foi atribuído a você (${r.regra}).`,
                }),
              400 + i * 1300,
            ),
          );
      }, 750 * (PASSOS.length + 1)),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lote]);

  if (!ingestAberto) return null;
  const fim = Boolean(res);
  const fechar = () => setIngestAberto(false);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && fim && fechar()}>
      <div className="modal ingest">
        <header className="modal-h">
          <div className="modal-ic">
            <DownloadCloud size={22} />
          </div>
          <div>
            <h2>Ingestão automática do PJe</h2>
            <p>{lote?.length} novo(s) processo(s) · sem digitação manual, sem planilha</p>
          </div>
          {fim && (
            <button className="icon-btn" onClick={fechar} aria-label="Fechar">
              <X size={18} />
            </button>
          )}
        </header>

        <ol className="stepper">
          {PASSOS.map((p, i) => {
            const Ic = p.icone;
            const st = passo > i ? 'feito' : passo === i ? 'rodando' : '';
            return (
              <li key={i} className={st}>
                <span className="st-ic">{st === 'feito' ? <Check size={15} strokeWidth={3} /> : st === 'rodando' ? <Loader2 size={15} className="spin" /> : <Ic size={15} />}</span>
                <span>{p.txt}</span>
              </li>
            );
          })}
        </ol>
        <div className="progress">
          <div style={{ width: `${(Math.max(passo, 0) / PASSOS.length) * 100}%` }} />
        </div>

        {fim && (
          <div className="ingest-res">
            <div className="res-kpis">
              <div>
                <PartyPopper size={18} />
                <b>{res.resultados.length}</b> capturados
              </div>
              <div className="danger">
                <Siren size={18} />
                <b>{res.resultados.filter((r) => r.processo.urgencia).length}</b> urgentes
              </div>
              <div className="warn">
                <AlertTriangle size={18} />
                <b>{res.resultados.filter((r) => r.processo.pendencias.length).length}</b> com pendência
              </div>
              <div className="ok">
                <ShieldCheck size={18} />
                <b>{res.resultados.filter((r) => !r.processo.pendencias.length).length}</b> cadastro OK
              </div>
            </div>
            <div className="res-list">
              {res.resultados.map(({ processo: p, analista }) => (
                <button
                  key={p.id}
                  className="res-row"
                  onClick={() => {
                    fechar();
                    abrirProcesso(p.id);
                  }}
                >
                  <NumeroProc numero={p.numero} destacar />
                  <span className="res-cls">{p.classe}</span>
                  <span className="res-tags">
                    {p.urgencia && <SlaBadge u={p.urgencia} mostrarTempo={false} />}
                    <PendenciaPill n={p.pendencias.length} compacto />
                  </span>
                  <span className="res-an">
                    <EquipeTag equipe={equipeDoNumero(p.numero)} />
                    {analista && <Avatar nome={analista.nome} cor={analistaPorId[analista.id]?.cor} size={24} />}
                  </span>
                </button>
              ))}
            </div>
            <footer className="modal-f">
              <small>Tempo total de triagem: ~{(PASSOS.length * 0.75 + 0.75).toFixed(1)}s · antes: ~{res.resultados.length * 6} min no Excel</small>
              <button id="btn-concluir-ingestao" className="btn btn-primary" onClick={fechar}>
                Concluir
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
