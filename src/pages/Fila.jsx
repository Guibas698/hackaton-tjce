import { useState } from 'react';
import { Columns3, List, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { NumeroProc, PendenciaPill, SlaBadge, Avatar, EquipeTag } from '../components/ui';
import { STATUS, equipeDoNumero } from '../lib/rules';
import { fmtDataHora } from '../lib/format';

export default function Fila() {
  const { processos, abrirProcesso, dispatch, analistaPorId, state } = useStore();
  const [visao, setVisao] = useState('kanban'); // 'kanban' | 'tabela'
  const [filtroEquipe, setFiltroEquipe] = useState('todas'); // 'todas' | 'par' | 'impar'

  const processosFiltrados = processos.filter((p) => {
    if (filtroEquipe === 'todas') return true;
    return equipeDoNumero(p.numero) === filtroEquipe;
  });

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h2>Fila de Trabalho e Distribuição Par/Ímpar</h2>
          <p className="subtext">
            Distribuição parametrizável baseada no final do número CNJ (Par/Ímpar) com balanceamento de carga entre analistas.
          </p>
        </div>
        <div className="page-actions">
          <div className="btn-group">
            <button
              className={`btn btn-sm ${filtroEquipe === 'todas' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFiltroEquipe('todas')}
            >
              Todos
            </button>
            <button
              className={`btn btn-sm ${filtroEquipe === 'par' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFiltroEquipe('par')}
            >
              Fila Par
            </button>
            <button
              className={`btn btn-sm ${filtroEquipe === 'impar' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFiltroEquipe('impar')}
            >
              Fila Ímpar
            </button>
          </div>

          <div className="btn-group">
            <button
              className={`btn btn-sm ${visao === 'kanban' ? 'btn-dark' : 'btn-outline'}`}
              onClick={() => setVisao('kanban')}
            >
              <Columns3 size={15} /> Kanban
            </button>
            <button
              className={`btn btn-sm ${visao === 'tabela' ? 'btn-dark' : 'btn-outline'}`}
              onClick={() => setVisao('tabela')}
            >
              <List size={15} /> Lista
            </button>
          </div>
        </div>
      </div>

      {visao === 'kanban' ? (
        <div className="kanban-board">
          {STATUS.map((coluna) => {
            const itens = processosFiltrados.filter((p) => p.status === coluna.id);
            return (
              <div key={coluna.id} className="kanban-col">
                <div className="kanban-col-header" style={{ borderTopColor: coluna.cor }}>
                  <div className="col-titulo">
                    <strong>{coluna.label}</strong>
                    <span className="col-count">{itens.length}</span>
                  </div>
                </div>

                <div className="kanban-col-body">
                  {itens.map((p) => {
                    const an = analistaPorId[p.analistaId];
                    const equipe = equipeDoNumero(p.numero);
                    return (
                      <div
                        key={p.id}
                        className={`kanban-card ${p.urgencia ? 'urgente' : ''}`}
                        onClick={() => abrirProcesso(p.id)}
                      >
                        <div className="kanban-card-top">
                          <NumeroProc numero={p.numero} destacar />
                          <EquipeTag equipe={equipe} />
                        </div>

                        <div className="kanban-card-title">{p.classe}</div>
                        <div className="kanban-card-sub">{p.assunto}</div>

                        <div className="kanban-card-tags">
                          {p.urgencia && <SlaBadge u={p.urgencia} />}
                          <PendenciaPill n={p.pendencias.length} compacto />
                        </div>

                        <div className="kanban-card-footer">
                          {an ? (
                            <div className="analista-inline">
                              <Avatar nome={an.nome} cor={an.cor} size={22} />
                              <span className="small">{an.nome.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-muted small">Não atribuído</span>
                          )}

                          <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                            {coluna.id !== 'concluido' && (
                              <button
                                className="btn-icon-subtle"
                                title="Avançar etapa"
                                onClick={() => {
                                  const idx = STATUS.findIndex((s) => s.id === coluna.id);
                                  if (idx < STATUS.length - 1) {
                                    dispatch({ type: 'MOVER', id: p.id, status: STATUS[idx + 1].id });
                                  }
                                }}
                              >
                                <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {itens.length === 0 && (
                    <div className="kanban-empty">Nenhum processo nesta etapa.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="pje-table">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Regra</th>
                <th>Classe / Assunto</th>
                <th>Status</th>
                <th>Urgência / SLA</th>
                <th>Analista Atribuído</th>
              </tr>
            </thead>
            <tbody>
              {processosFiltrados.map((p) => {
                const an = analistaPorId[p.analistaId];
                const equipe = equipeDoNumero(p.numero);
                const st = STATUS.find((s) => s.id === p.status);
                return (
                  <tr key={p.id} onClick={() => abrirProcesso(p.id)} className="cursor-pointer">
                    <td>
                      <NumeroProc numero={p.numero} destacar />
                      <div className="text-muted small">{fmtDataHora(p.autuadoEm)}</div>
                    </td>
                    <td>
                      <EquipeTag equipe={equipe} />
                    </td>
                    <td>
                      <strong>{p.classe}</strong>
                      <div className="text-muted small">{p.assunto}</div>
                    </td>
                    <td>
                      <span className="status-pill" style={{ backgroundColor: `${st?.cor}20`, color: st?.cor }}>
                        {st?.label}
                      </span>
                    </td>
                    <td>{p.urgencia ? <SlaBadge u={p.urgencia} /> : <span className="text-muted">—</span>}</td>
                    <td>
                      {an ? (
                        <div className="analista-cell">
                          <Avatar nome={an.nome} cor={an.cor} size={22} />
                          <span>{an.nome}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
