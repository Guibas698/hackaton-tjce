import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, Search, Send, FileWarning, ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store';
import { NumeroProc, PendenciaPill, SlaBadge, Avatar, EquipeTag } from '../components/ui';
import { fmtMoeda, fmtDataHora } from '../lib/format';
import { equipeDoNumero } from '../lib/rules';

export default function Triagem() {
  const { processos, abrirProcesso, dispatch, toast, analistaPorId } = useStore();
  const [busca, setBusca] = useState('');
  const [filtroErro, setFiltroErro] = useState('todos');

  const totalPendentes = processos.filter((p) => p.pendencias.length > 0).length;
  const totalValidos = processos.filter((p) => p.pendencias.length === 0).length;

  const lista = processos.filter((p) => {
    if (filtroErro === 'pendentes' && p.pendencias.length === 0) return false;
    if (filtroErro === 'ok' && p.pendencias.length > 0) return false;
    if (filtroErro === 'cpf' && !p.pendencias.some((e) => e.path.includes('doc'))) return false;
    if (filtroErro === 'oab' && !p.pendencias.some((e) => e.path.includes('advogado') || e.path.includes('oab'))) return false;
    if (filtroErro === 'tpu' && !p.pendencias.some((e) => e.path === 'assunto' || e.path === 'numero')) return false;

    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.numero.toLowerCase().includes(termo) ||
      p.classe.toLowerCase().includes(termo) ||
      p.assunto.toLowerCase().includes(termo) ||
      p.poloAtivo.some((x) => x.nome.toLowerCase().includes(termo)) ||
      p.poloPassivo.some((x) => x.nome.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="page-content">
      {/* Cabeçalho Limpo */}
      <div className="page-header-row">
        <div>
          <h2>Auditoria & Validação de Cadastros</h2>
          <p className="subtext">
            Conferência automática de número CNJ, documentos de partes, regularidade de OAB e parametrização com a TPU.
          </p>
        </div>
        <div className="page-actions">
          <div className="pill pill-ok">
            <CheckCircle2 size={13} /> {totalValidos} Regulares
          </div>
          <div className="pill pill-warn">
            <AlertTriangle size={13} /> {totalPendentes} Com Inconsistência
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa Integrada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filtroErro === 'todos' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroErro('todos')}
          >
            Todos ({processos.length})
          </button>
          <button
            className={`btn btn-sm ${filtroErro === 'pendentes' ? 'btn-warn' : 'btn-outline'}`}
            onClick={() => setFiltroErro('pendentes')}
          >
            Com Inconsistência ({totalPendentes})
          </button>
          <button
            className={`btn btn-sm ${filtroErro === 'cpf' ? 'btn-warn' : 'btn-outline'}`}
            onClick={() => setFiltroErro('cpf')}
          >
            CPF/CNPJ
          </button>
          <button
            className={`btn btn-sm ${filtroErro === 'oab' ? 'btn-warn' : 'btn-outline'}`}
            onClick={() => setFiltroErro('oab')}
          >
            OAB
          </button>
          <button
            className={`btn btn-sm ${filtroErro === 'tpu' ? 'btn-warn' : 'btn-outline'}`}
            onClick={() => setFiltroErro('tpu')}
          >
            Classe/TPU
          </button>
          <button
            className={`btn btn-sm ${filtroErro === 'ok' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroErro('ok')}
          >
            Regulares ({totalValidos})
          </button>
        </div>

        <div className="search-box" style={{ maxWidth: '340px' }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Filtrar por processo ou parte..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Ingestão e Triagem com Destaque Amarelo */}
      <div className="table-responsive">
        <table className="pje-table">
          <thead>
            <tr>
              <th>Processo / Autuação</th>
              <th>Classe & Assunto</th>
              <th>Partes Cadastradas</th>
              <th>Inconsistências Detectadas</th>
              <th>Servidor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted">
                  Nenhum processo localizado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              lista.map((p) => {
                const an = analistaPorId[p.analistaId];
                const equipe = equipeDoNumero(p.numero);
                const temErro = p.pendencias.length > 0;

                return (
                  <tr key={p.id} className={temErro ? 'row-warning' : ''}>
                    <td>
                      <div className="proc-cell">
                        <button className="link-proc" onClick={() => abrirProcesso(p.id)}>
                          <NumeroProc numero={p.numero} destacar />
                        </button>
                        <div className="proc-badges">
                          <EquipeTag equipe={equipe} />
                          {p.urgencia && <SlaBadge u={p.urgencia} />}
                        </div>
                        <small className="text-muted">{fmtDataHora(p.autuadoEm)}</small>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{p.classe}</strong>
                      <div className="text-muted small">{p.assunto}</div>
                      <div className="text-muted small" style={{ fontWeight: '600' }}>
                        {fmtMoeda(p.valorCausa)}
                      </div>
                    </td>
                    <td>
                      <div className="partes-cell">
                        <div>
                          <span className="badge-polo">A</span>{' '}
                          <span style={{ fontWeight: '600' }}>{p.poloAtivo.map((x) => x.nome).join(', ')}</span>
                        </div>
                        <div>
                          <span className="badge-polo passivo">P</span>{' '}
                          <span className="text-muted">{p.poloPassivo.map((x) => x.nome).join(', ')}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {temErro ? (
                        <div className="pendencias-lista">
                          <PendenciaPill n={p.pendencias.length} />
                          <ul className="pendencias-resumo">
                            {p.pendencias.map((pend, idx) => (
                              <li key={idx} style={{ marginTop: '2px', lineHeight: '1.3' }}>
                                <span style={{ background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                                  {pend.campo}
                                </span>{' '}
                                <span style={{ color: '#92400e' }}>{pend.msg}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="badge-ok">
                          <CheckCircle2 size={14} /> Regular
                        </span>
                      )}
                    </td>
                    <td>
                      {an ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar nome={an.nome} cor={an.cor} size={26} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600' }}>{an.nome.split(' ')[0]}</div>
                            <small className="text-muted" style={{ fontSize: '10px' }}>Equipe {an.equipe}</small>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => abrirProcesso(p.id)}
                          title="Abrir detalhes do processo"
                        >
                          Ver
                        </button>
                        {temErro && !p.emendaSolicitada && (
                          <button
                            className="btn btn-sm btn-warn"
                            title="Intimar advogado para emenda da petição inicial (art. 321 CPC)"
                            onClick={() => {
                              dispatch({
                                type: 'EMENDA',
                                id: p.id,
                                notificacao: {
                                  id: `e${Date.now()}`,
                                  canal: 'email',
                                  titulo: `Intimação para emenda expedida · ${p.numero}`,
                                  corpo: `Intimação gerada para o patrono da causa via Diário da Justiça Eletrônico`,
                                  processoId: p.id,
                                  em: new Date().toISOString(),
                                  lida: false,
                                },
                              });
                              toast({
                                tipo: 'email',
                                titulo: 'Intimação Expedida (art. 321 CPC)',
                                corpo: `Advogado(a) intimado(a) a regularizar o cadastro em 15 dias.`,
                              });
                            }}
                          >
                            <Send size={13} /> Intimar
                          </button>
                        )}
                        {p.emendaSolicitada && (
                          <span className="pill pill-info" title="Emenda já requerida">
                            Intimado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
