import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Filter, Search, Send } from 'lucide-react';
import { useStore } from '../lib/store';
import { NumeroProc, PendenciaPill, SlaBadge, Avatar, EquipeTag } from '../components/ui';
import { fmtMoeda, fmtDataHora } from '../lib/format';
import { equipeDoNumero } from '../lib/rules';

export default function Triagem() {
  const { processos, abrirProcesso, dispatch, toast, analistaPorId } = useStore();
  const [busca, setBusca] = useState('');
  const [somentePendencias, setSomentePendencias] = useState(true);

  const lista = processos.filter((p) => {
    if (somentePendencias && p.pendencias.length === 0) return false;
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
      <div className="page-header-row">
        <div>
          <h2>Ingestão e Validação de Cadastro</h2>
          <p className="subtext">
            Leitura automática das petições do PJe com destaque visual em amarelo para inconsistências cadastrais (CNJ, CPF/CNPJ, OAB e TPU).
          </p>
        </div>
        <div className="page-actions">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={somentePendencias}
              onChange={(e) => setSomentePendencias(e.target.checked)}
            />
            <span>Apenas com pendências ({processos.filter((p) => p.pendencias.length > 0).length})</span>
          </label>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Filtrar por número, parte, classe ou assunto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="pje-table">
          <thead>
            <tr>
              <th>Processo / Distribuição</th>
              <th>Classe & Assunto</th>
              <th>Polo Ativo & Passivo</th>
              <th>Pendências de Cadastro</th>
              <th>Analista</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted">
                  Nenhum processo encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              lista.map((p) => {
                const an = analistaPorId[p.analistaId];
                const equipe = equipeDoNumero(p.numero);
                return (
                  <tr key={p.id} className={p.pendencias.length > 0 ? 'row-warning' : ''}>
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
                      <strong>{p.classe}</strong>
                      <div className="text-muted small">{p.assunto}</div>
                      <div className="text-muted small">{fmtMoeda(p.valorCausa)}</div>
                    </td>
                    <td>
                      <div className="partes-cell">
                        <div>
                          <span className="badge-polo">A</span> {p.poloAtivo.map((x) => x.nome).join(', ')}
                        </div>
                        <div>
                          <span className="badge-polo passivo">P</span> {p.poloPassivo.map((x) => x.nome).join(', ')}
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.pendencias.length > 0 ? (
                        <div className="pendencias-lista">
                          <PendenciaPill n={p.pendencias.length} />
                          <ul className="pendencias-resumo">
                            {p.pendencias.slice(0, 2).map((pend, idx) => (
                              <li key={idx} title={pend.msg}>
                                ⚠️ <b>{pend.campo}</b>: {pend.msg}
                              </li>
                            ))}
                            {p.pendencias.length > 2 && (
                              <li className="text-muted">+{p.pendencias.length - 2} pendência(s)...</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <span className="badge-ok">
                          <CheckCircle2 size={14} /> Cadastro Válido
                        </span>
                      )}
                    </td>
                    <td>
                      {an ? (
                        <div className="analista-cell">
                          <Avatar nome={an.nome} cor={an.cor} size={24} />
                          <span>{an.nome.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => abrirProcesso(p.id)}
                        >
                          Ver Detalhes
                        </button>
                        {p.pendencias.length > 0 && !p.emendaSolicitada && (
                          <button
                            className="btn btn-sm btn-warn"
                            title="Intimar parte para emenda (art. 321 do CPC)"
                            onClick={() => {
                              dispatch({
                                type: 'EMENDA',
                                id: p.id,
                                notificacao: {
                                  id: `e${Date.now()}`,
                                  canal: 'email',
                                  titulo: `Intimação para emenda · ${p.numero}`,
                                  corpo: `Enviada para o patrono constituído via Diário Eletrônico`,
                                  processoId: p.id,
                                  em: new Date().toISOString(),
                                  lida: false,
                                },
                              });
                              toast({
                                tipo: 'email',
                                titulo: 'Intimação expedida',
                                corpo: 'Notificação de emenda gerada (art. 321 CPC).',
                              });
                            }}
                          >
                            <Send size={13} /> Intimar
                          </button>
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
