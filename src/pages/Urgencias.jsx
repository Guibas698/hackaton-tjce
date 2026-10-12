import { useState } from 'react';
import { Siren, Clock, AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';
import { useStore, useNow } from '../lib/store';
import { NumeroProc, SlaBadge, RingCountdown, Avatar, EquipeTag, estadoSla, TeamsLogo } from '../components/ui';
import { fmtDataHora } from '../lib/format';
import { equipeDoNumero } from '../lib/rules';

export default function Urgencias() {
  const { processos, abrirProcesso, analistaPorId, toast } = useStore();
  const now = useNow(1000);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const urgentes = processos
    .filter((p) => p.status !== 'concluido' && p.urgencia)
    .sort((a, b) => a.urgencia.prazo - b.urgencia.prazo);

  const filtrados = urgentes.filter((p) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'REU_PRESO') return p.urgencia.tipo === 'REU_PRESO';
    if (filtroTipo === 'IDOSO_80') return p.urgencia.tipo === 'IDOSO_80';
    if (filtroTipo === 'IDOSO') return p.urgencia.tipo === 'IDOSO' || p.urgencia.tipo === 'IDOSO_80';
    if (filtroTipo === 'TUTELA') return p.urgencia.tipo === 'TUTELA';
    if (filtroTipo === 'RISCO') {
      const st = estadoSla(p.urgencia, now).estado;
      return st === 'critico' || st === 'vencido';
    }
    return true;
  });

  const countReuPreso = urgentes.filter((p) => p.urgencia.tipo === 'REU_PRESO').length;
  const countIdoso80 = urgentes.filter((p) => p.urgencia.tipo === 'IDOSO_80').length;
  const countIdoso = urgentes.filter((p) => p.urgencia.tipo === 'IDOSO').length;
  const countTutela = urgentes.filter((p) => p.urgencia.tipo === 'TUTELA').length;
  const countRisco = urgentes.filter((p) => {
    const st = estadoSla(p.urgencia, now).estado;
    return st === 'critico' || st === 'vencido';
  }).length;

  return (
    <div className="page-content">
      {/* Cabeçalho Limpo e Direto */}
      <div className="page-header-row">
        <div>
          <h2>Monitor de Urgências e Prazos Regimentais</h2>
          <p className="subtext">
            Acompanhamento de prazos de réus presos (24h), prioridades de idosos (24h/48h) e tutelas liminares.
          </p>
        </div>
        <div className="page-actions">
          {countRisco > 0 ? (
            <div className="pill pill-red">
              <Siren size={14} /> {countRisco} em risco de vencimento
            </div>
          ) : (
            <div className="pill pill-ok">
              <ShieldCheck size={14} /> Todos os prazos em dia
            </div>
          )}
        </div>
      </div>

      {/* Seletor Rápido de Categorias com Métricas */}
      <div className="stats-row">
        <button
          className={`stat-box ${filtroTipo === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('todos')}
        >
          <Clock size={18} color="var(--pje-blue)" />
          <div>
            <strong>{urgentes.length}</strong>
            <span>Todas as Urgências</span>
          </div>
        </button>

        <button
          className={`stat-box danger ${filtroTipo === 'REU_PRESO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('REU_PRESO')}
        >
          <Siren size={18} color="var(--danger)" />
          <div>
            <strong>{countReuPreso}</strong>
            <span>Réu Preso (24h)</span>
          </div>
        </button>

        <button
          className={`stat-box alert ${filtroTipo === 'IDOSO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('IDOSO')}
        >
          <HeartPulse size={18} color="var(--warning)" />
          <div>
            <strong>{countIdoso80 + countIdoso}</strong>
            <span>Prioridade Idoso (24h/48h)</span>
          </div>
        </button>

        <button
          className={`stat-box warning ${filtroTipo === 'RISCO' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('RISCO')}
        >
          <AlertTriangle size={18} color={countRisco > 0 ? 'var(--danger)' : 'var(--warning)'} />
          <div>
            <strong style={{ color: countRisco > 0 ? 'var(--danger)' : 'inherit' }}>{countRisco}</strong>
            <span>Críticos / Vencidos</span>
          </div>
        </button>
      </div>

      {/* Grid de Cards de Urgência */}
      <div className="urgencias-grid">
        {filtrados.length === 0 ? (
          <div className="vazio" style={{ gridColumn: '1 / -1', padding: '50px 20px', textAlign: 'center' }}>
            <ShieldCheck size={48} color="var(--success)" style={{ margin: '0 auto 10px' }} />
            <h3>Nenhum processo pendente nesta categoria</h3>
            <p className="text-muted">Não há pendências ativas para o filtro selecionado.</p>
          </div>
        ) : (
          filtrados.map((p) => {
            const an = analistaPorId[p.analistaId];
            const equipe = equipeDoNumero(p.numero);
            const { restante, estado } = estadoSla(p.urgencia, now);

            return (
              <div
                key={p.id}
                className={`card-urgencia ${p.urgencia.tipo.toLowerCase()} est-${estado}`}
                onClick={() => abrirProcesso(p.id)}
              >
                <div className="card-urgencia-header">
                  <div>
                    <SlaBadge u={p.urgencia} grande />
                    <span className="autuado-tempo">
                      Autuado em: {fmtDataHora(p.autuadoEm)}
                    </span>
                    {p.estabelecimentoPrisional && (
                      <span className="pill pill-red" style={{ marginTop: '5px', fontSize: '10px' }}>
                        Custódia: {p.estabelecimentoPrisional}
                      </span>
                    )}
                  </div>
                  <RingCountdown u={p.urgencia} size={76} />
                </div>

                <div className="card-urgencia-body">
                  <h4 className="proc-titulo">
                    <NumeroProc numero={p.numero} destacar />
                  </h4>
                  <div className="classe-sub">{p.classe}</div>
                  <div className="assunto-tag">Assunto: <strong>{p.assunto}</strong></div>

                  <p className="resumo-curto" title={p.resumo}>
                    {p.resumo}
                  </p>

                  <div className="partes-resumo">
                    <div>
                      <small className="text-muted">Autor:</small>{' '}
                      <strong>{p.poloAtivo[0]?.nome || 'Ministério Público'}</strong>
                    </div>
                    <div>
                      <small className="text-muted">Réu/Requerido:</small>{' '}
                      <strong style={{ color: p.reuPreso ? 'var(--danger)' : 'inherit' }}>
                        {p.poloPassivo[0]?.nome || 'A Apurar'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card-urgencia-footer">
                  <div className="distribuicao-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EquipeTag equipe={equipe} />
                    {an ? (
                      <div className="analista-inline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar nome={an.nome} cor={an.cor} size={22} />
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{an.nome.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Não atribuído</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      title="Simular reenvio de alerta Teams"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          tipo: 'teams',
                          nivel: p.urgencia.nivel,
                          analista: an?.nome || 'Analista',
                          processoId: p.id,
                          titulo: `ALERTA REGIMENTAL: ${p.urgencia.label}`,
                          corpo: `Processo ${p.numero} com prazo de ${p.urgencia.horas}h pendente de conclusão.`,
                        });
                      }}
                    >
                      <TeamsLogo size={13} /> Alerta
                    </button>
                    <button className="btn btn-sm btn-primary">
                      Abrir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
