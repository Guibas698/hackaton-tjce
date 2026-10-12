import { useMemo } from 'react';
import { Inbox, Siren, AlertTriangle, Target, ArrowRight, Users, Activity, Hourglass, Zap, DownloadCloud, TrendingDown } from 'lucide-react';
import { useStore, useNow } from '../lib/store';
import { Avatar, Card, EquipeTag, NumeroProc, SlaBadge, Vazio, estadoSla } from '../components/ui';
import { saudacao, fmtHorasCurto } from '../lib/format';
import { USUARIO, VARA } from '../lib/mockData';

function Kpi({ icone: Ic, rotulo, valor, detalhe, tom, onClick, id }) {
  return (
    <button className={`kpi tom-${tom}`} onClick={onClick} id={id}>
      <span className="kpi-ic">
        <Ic size={20} />
      </span>
      <span className="kpi-v">{valor}</span>
      <span className="kpi-r">{rotulo}</span>
      {detalhe && <span className="kpi-d">{detalhe}</span>}
    </button>
  );
}

function GraficoEntradas({ processos }) {
  const dias = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const fim = d.getTime() + 86400e3;
      out.push({
        rot: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        entradas: processos.filter((p) => {
          const t = new Date(p.autuadoEm).getTime();
          return t >= d.getTime() && t < fim;
        }).length,
        concluidos: processos.filter((p) => {
          const t = p.concluidoEm && new Date(p.concluidoEm).getTime();
          return t && t >= d.getTime() && t < fim;
        }).length,
      });
    }
    return out;
  }, [processos]);
  const W = 520;
  const H = 170;
  const max = Math.max(4, ...dias.map((d) => Math.max(d.entradas, d.concluidos)));
  const x = (i) => 24 + (i * (W - 48)) / 6;
  const y = (v) => H - 26 - (v / max) * (H - 50);
  const linha = (k) => dias.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[k])}`).join(' ');
  const area = `${linha('entradas')} L${x(6)},${H - 26} L${x(0)},${H - 26} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart">
      <defs>
        <linearGradient id="gEnt" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--pje-500)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--pje-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1="24" x2={W - 24} y1={y(max * f)} y2={y(max * f)} className="grid-l" />
      ))}
      <path d={area} fill="url(#gEnt)" />
      <path d={linha('entradas')} className="ln ln-a" />
      <path d={linha('concluidos')} className="ln ln-b" />
      {dias.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.entradas)} r="4" className="pt-a" />
          <circle cx={x(i)} cy={y(d.concluidos)} r="3.5" className="pt-b" />
          <text x={x(i)} y={H - 6} className="ax">
            {d.rot}
          </text>
          {d.entradas > 0 && (
            <text x={x(i)} y={y(d.entradas) - 10} className="val">
              {d.entradas}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Painel() {
  const { processos, state, setPagina, abrirProcesso, analistaPorId, setIngestAberto } = useStore();
  const now = useNow(5000);
  const abertos = processos.filter((p) => p.status !== 'concluido');
  const urgentes = abertos.filter((p) => p.urgencia).sort((a, b) => a.urgencia.prazo - b.urgencia.prazo);
  const emRisco = urgentes.filter((p) => ['critico', 'vencido'].includes(estadoSla(p.urgencia, now).estado));
  const pend = abertos.filter((p) => p.pendencias.length);
  const concluidosSla = processos.filter((p) => p.status === 'concluido' && p.urgencia);
  const noPrazo = concluidosSla.filter((p) => new Date(p.concluidoEm).getTime() <= p.urgencia.prazo).length;
  // base histórica da vara (12 meses) + concluídos no sistema
  const taxa = ((1247 + noPrazo) / (1249 + concluidosSla.length)) * 100;

  const carga = state.analistas.map((a) => {
    const meus = abertos.filter((p) => p.analistaId === a.id);
    return { a, total: meus.length, urg: meus.filter((p) => p.urgencia).length };
  });
  const maxCarga = Math.max(1, ...carga.map((c) => c.total));
  const gargalos = abertos
    .map((p) => ({ p, parado: now - new Date(p.statusDesde).getTime() }))
    .filter((x) => x.parado > 48 * 3600e3)
    .sort((a, b) => b.parado - a.parado)
    .slice(0, 4);

  return (
    <div className="page-grid">
      <section className="hero">
        <div className="hero-txt">
          <span className="hero-kicker">
            <Activity size={14} /> {VARA} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </span>
          <h2>
            {saudacao()}, {USUARIO.nome.split(' ')[0]}.
          </h2>
          <p>
            {emRisco.length > 0 ? (
              <>
                <b>{emRisco.length} urgência(s)</b> precisam de atenção agora. A fila foi distribuída automaticamente, sem planilha.
              </>
            ) : (
              <>Todas as urgências estão dentro do prazo. A fila foi distribuída automaticamente, sem planilha.</>
            )}
          </p>
          <div className="hero-actions">
            <button className="btn btn-light" onClick={() => setIngestAberto(true)} id="hero-capturar">
              <DownloadCloud size={17} /> Capturar novos processos
            </button>
            <button className="btn btn-outline-light" onClick={() => setPagina('urgencias')}>
              Ver painel SLA <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <Zap size={18} />
            <b>8s</b>
            <small>triagem por processo</small>
          </div>
          <div>
            <TrendingDown size={18} />
            <b>−95%</b>
            <small>tempo braçal</small>
          </div>
          <div>
            <Target size={18} />
            <b>{taxa.toFixed(1)}%</b>
            <small>SLA cumprido</small>
          </div>
        </div>
      </section>

      <div className="kpis">
        <Kpi id="kpi-fila" icone={Inbox} rotulo="Processos na fila" valor={abertos.length} detalhe={`${processos.filter((p) => p.status === 'triagem').length} aguardando análise`} tom="azul" onClick={() => setPagina('fila')} />
        <Kpi id="kpi-urgencias" icone={Siren} rotulo="Urgências ativas" valor={urgentes.length} detalhe={`${emRisco.length} em risco ou vencidas`} tom="vermelho" onClick={() => setPagina('urgencias')} />
        <Kpi id="kpi-pendencias" icone={AlertTriangle} rotulo="Pendências de cadastro" valor={pend.length} detalhe="destacadas em amarelo" tom="amarelo" onClick={() => setPagina('triagem')} />
        <Kpi id="kpi-sla" icone={Target} rotulo="Cumprimento de SLA" valor={`${taxa.toFixed(1)}%`} detalhe="últimos 12 meses" tom="verde" onClick={() => setPagina('urgencias')} />
      </div>

      <div className="row-2">
        <Card titulo="Urgências por prazo" icone={Siren} acao={<button className="link" onClick={() => setPagina('urgencias')}>Ver todas <ArrowRight size={14} /></button>}>
          {urgentes.length === 0 && <Vazio icone={Siren} titulo="Sem urgências" />}
          <div className="urg-list">
            {urgentes.slice(0, 6).map((p) => {
              const an = analistaPorId[p.analistaId];
              return (
                <button key={p.id} className="urg-row" onClick={() => abrirProcesso(p.id)}>
                  <SlaBadge u={p.urgencia} />
                  <span className="urg-info">
                    <NumeroProc numero={p.numero} />
                    <small>{p.classe}</small>
                  </span>
                  {an && <Avatar nome={an.nome} cor={an.cor} size={28} />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card titulo="Carga por analista" icone={Users} acao={<span className="hint">Regra: {state.config.modo === 'par_impar' ? 'Par/Ímpar' : 'Round-robin'}</span>}>
          <div className="carga">
            {carga.map(({ a, total, urg }) => (
              <div key={a.id} className={`carga-row ${a.ativo ? '' : 'inativo'}`}>
                <Avatar nome={a.nome} cor={a.cor} size={32} />
                <div className="carga-info">
                  <div className="carga-top">
                    <strong>{a.nome}</strong>
                    <EquipeTag equipe={a.equipe} />
                    {!a.ativo && <em className="pill">Ausente</em>}
                    <span className="carga-n">{total}</span>
                  </div>
                  <div className="bar">
                    <span className="bar-urg" style={{ width: `${(urg / maxCarga) * 100}%` }} />
                    <span className="bar-norm" style={{ width: `${((total - urg) / maxCarga) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="legenda">
              <span>
                <i className="lg-urg" /> Urgentes
              </span>
              <span>
                <i className="lg-norm" /> Demais
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="row-3">
        <Card titulo="Entradas x Concluídos · 7 dias" icone={Activity} className="span-2">
          <GraficoEntradas processos={processos} />
          <div className="legenda">
            <span>
              <i className="lg-a" /> Entradas (captura automática)
            </span>
            <span>
              <i className="lg-b" /> Concluídos
            </span>
          </div>
        </Card>
        <Card titulo="Gargalos (parados > 48h)" icone={Hourglass}>
          {gargalos.length === 0 && <Vazio icone={Hourglass} titulo="Nenhum gargalo" texto="Fila fluindo bem." />}
          <div className="garg-list">
            {gargalos.map(({ p, parado }) => (
              <button key={p.id} className="garg" onClick={() => abrirProcesso(p.id)}>
                <span>
                  <NumeroProc numero={p.numero} />
                  <small>
                    {p.classe} · {analistaPorId[p.analistaId]?.nome.split(' ')[0]}
                  </small>
                </span>
                <em>{fmtHorasCurto(parado)}</em>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card titulo="Impacto: antes x depois" icone={Zap} className="impacto">
        <div className="imp-grid">
          {[
            ['Triagem por processo', '5–8 min', '< 10 s', 'Excel → PJe+'],
            ['Conferência de cadastro', 'manual', 'automática', 'CNJ, CPF/CNPJ, OAB, TPU'],
            ['Consulta de histórico (CPF)', '3–5 min', '0,5 s', 'Dossiê Dona Maria'],
            ['Aviso de Réu Preso', 'quando alguém vê', 'na hora', 'Teams + e-mail'],
          ].map(([t, a, d, s]) => (
            <div key={t} className="imp">
              <small>{t}</small>
              <div>
                <span className="antes">{a}</span>
                <ArrowRight size={16} />
                <span className="depois">{d}</span>
              </div>
              <em>{s}</em>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
