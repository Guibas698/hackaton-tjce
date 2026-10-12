import { useState } from 'react';
import { Siren, Clock, AlertTriangle, ShieldCheck, Search, Filter } from 'lucide-react';
import { useStore, useNow } from '../lib/store';
import { NumeroProc, SlaBadge, RingCountdown, Avatar, EquipeTag, estadoSla } from '../components/ui';
import { fmtDataHora } from '../lib/format';
import { equipeDoNumero } from '../lib/rules';

export default function Urgencias() {
  const { processos, abrirProcesso, analistaPorId } = useStore();
  const now = useNow(1000);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const urgentes = processos
    .filter((p) => p.status !== 'concluido' && p.urgencia)
    .sort((a, b) => a.urgencia.prazo - b.urgencia.prazo);

  const filtrados = urgentes.filter((p) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'REU_PRESO') return p.urgencia.tipo === 'REU_PRESO';
    if (filtroTipo === 'IDOSO') return p.urgencia.tipo.startsWith('IDOSO');
    if (filtroTipo === 'TUTELA') return p.urgencia.tipo === 'TUTELA';
    if (filtroTipo === 'RISCO') {
      const st = estadoSla(p.urgencia, now).estado;
      return st === 'critico' || st === 'vencido';
    }
    return true;
  });

  const reuPresoCount = urgentes.filter((p) => p.urgencia.tipo === 'REU_PRESO').length;
  const idosoCount = urgentes.filter((p) => p.urgencia.tipo.startsWith('IDOSO')).length;
  const tutelaCount = urgentes.filter((p) => p.urgencia.tipo === 'TUTELA').length;
  const emRiscoCount = urgentes.filter((p) => {
    const st = estadoSla(p.urgencia, now).estado;
    return st === 'critico' || st === 'vencido';
  }).length;

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h2>Painel SLA de Urgências (24h / 48h)</h2>
          <p className="subtext">
            Monitoramento em tempo real de tutelas de urgência, Réu Preso (24h) e Idoso (24h/48h) com disparo de notificações.
          </p>
        </div>
      </div>

      <div className="stats-row">
        <button
          className={`stat-box ${filtroTipo === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('todos')}
        >
          <Clock size={18} />
          <div>
            <strong>{urgentes.length}</strong>
            <span>Todas as Urgências</span>
          </div>
        </button>
        <button
          className={`stat-box danger ${filtroTipo === 'REU_PRESO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('REU_PRESO')}
        >
          <Siren size={18} />
          <div>
            <strong>{reuPresoCount}</strong>
            <span>Réu Preso (24h)</span>
          </div>
        </button>
        <button
          className={`stat-box alert ${filtroTipo === 'IDOSO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('IDOSO')}
        >
          <AlertTriangle size={18} />
          <div>
            <strong>{idosoCount}</strong>
            <span>Prioridade Idoso (24/48h)</span>
          </div>
        </button>
        <button
          className={`stat-box warning ${filtroTipo === 'RISCO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('RISCO')}
        >
          <Clock size={18} />
          <div>
            <strong>{emRiscoCount}</strong>
            <span>Em Risco / Vencidos</span>
          </div>
        </button>
      </div>

      <div className="urgencias-grid">
        {filtrados.length === 0 ? (
          <div className="vazio span-full">
            <ShieldCheck size={48} className="text-success" />
            <h3>Nenhuma urgência nesta categoria</h3>
            <p>Todos os prazos críticos estão sob controle ou cumpridos.</p>
          </div>
        ) : (
          filtrados.map((p) => {
            const an = analistaPorId[p.analistaId];
            const equipe = equipeDoNumero(p.numero);
            return (
              <div
                key={p.id}
                className={`card-urgencia ${p.urgencia.tipo.toLowerCase()}`}
                onClick={() => abrirProcesso(p.id)}
              >
                <div className="card-urgencia-header">
                  <div>
                    <SlaBadge u={p.urgencia} grande />
                    <span className="autuado-tempo">Autuado: {fmtDataHora(p.autuadoEm)}</span>
                  </div>
                  <RingCountdown u={p.urgencia} size={74} />
                </div>

                <div className="card-urgencia-body">
                  <h4 className="proc-titulo">
                    <NumeroProc numero={p.numero} destacar />
                  </h4>
                  <div className="classe-sub">{p.classe}</div>
                  <div className="assunto-tag">{p.assunto}</div>

                  <p className="resumo-curto">{p.resumo}</p>

                  <div className="partes-resumo">
                    <div>
                      <small className="text-muted">Autor:</small>{' '}
                      <b>{p.poloAtivo[0]?.nome}</b>
                    </div>
                    <div>
                      <small className="text-muted">Réu:</small>{' '}
                      <b>{p.poloPassivo[0]?.nome}</b>
                    </div>
                  </div>
                </div>

                <div className="card-urgencia-footer">
                  <div className="distribuicao-info">
                    <EquipeTag equipe={equipe} />
                    {an ? (
                      <div className="analista-inline">
                        <Avatar nome={an.nome} cor={an.cor} size={22} />
                        <span>{an.nome.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-muted">Não atribuído</span>
                    )}
                  </div>
                  <button className="btn btn-sm btn-primary">Abrir Análise</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
