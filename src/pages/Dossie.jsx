import { useState, useEffect } from 'react';
import { UserSearch, Search, AlertTriangle, ShieldCheck, Building2, User, FileText, ChevronRight, History, ArrowUpRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { NumeroProc, SlaBadge } from '../components/ui';
import { buscarPartes, montarDossie } from '../lib/rules';
import { fmtMoeda, fmtData } from '../lib/format';

export default function Dossie() {
  const { todos, dossieAlvo, setDossieAlvo, abrirProcesso } = useStore();
  const [termo, setTermo] = useState(dossieAlvo || 'Maria das Graças');
  const sugestoes = termo ? buscarPartes(termo, todos) : [];
  const [chaveSelecionada, setChaveSelecionada] = useState(dossieAlvo || '');

  useEffect(() => {
    if (dossieAlvo) {
      setTermo(dossieAlvo);
      setChaveSelecionada(dossieAlvo);
    } else if (!chaveSelecionada && sugestoes.length > 0) {
      setChaveSelecionada(sugestoes[0].chave);
    }
  }, [dossieAlvo, sugestoes.length]);

  const dossie = chaveSelecionada ? montarDossie(chaveSelecionada, todos) : null;

  return (
    <div className="page-content">
      {/* Cabeçalho Limpo */}
      <div className="page-header-row">
        <div>
          <h2>Consulta & Dossiê Unificado de Partes</h2>
          <p className="subtext">
            Pesquisa integrada por CPF/CNPJ com histórico unificado de feitos e verificação de prevenção (arts. 55 e 286 do CPC).
          </p>
        </div>
      </div>

      {/* Caixa de Busca com Filtros Rápidos */}
      <div className="search-section card p-4 mb-4">
        <label className="text-muted small mb-2 d-block" style={{ fontWeight: '600' }}>
          Consultar por CPF, CNPJ ou Nome da Parte:
        </label>
        <div className="search-input-group">
          <Search size={17} color="var(--pje-blue)" />
          <input
            type="text"
            className="search-input"
            placeholder="Digite CPF, CNPJ ou nome da parte..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>

        {sugestoes.length > 0 && (
          <div className="mt-3">
            <span className="small text-muted d-block mb-2" style={{ fontWeight: '600' }}>
              Partes sugeridas na base:
            </span>
            <div className="chips-list">
              {sugestoes.slice(0, 6).map((s, idx) => (
                <button
                  key={idx}
                  className={`chip-btn ${chaveSelecionada === s.chave ? 'active' : ''}`}
                  onClick={() => {
                    setChaveSelecionada(s.chave);
                    setDossieAlvo(s.chave);
                  }}
                >
                  {s.tipo === 'PJ' ? <Building2 size={13} /> : <User size={13} />}
                  <span>{s.nome}</span>
                  <span className="badge-count">{s.total} feitos</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultados do Dossiê */}
      {dossie && (
        <div className="dossie-results">
          {/* Resumo Quantitativo da Parte */}
          <div className="dossie-stats-bar card p-3 mb-4">
            <div className="stat-item">
              <small className="text-muted">Total de Processos</small>
              <strong>{dossie.lista.length}</strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Polo Ativo (Autora)</small>
              <strong style={{ color: 'var(--success)' }}>
                {dossie.lista.filter((x) => x.papel === 'Autor(a)').length}
              </strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Polo Passivo (Ré)</small>
              <strong style={{ color: 'var(--danger)' }}>
                {dossie.lista.filter((x) => x.papel !== 'Autor(a)').length}
              </strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Matérias Distintas</small>
              <strong style={{ color: 'var(--gold)' }}>
                {Object.keys(dossie.grupos).length}
              </strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Prevenção / Conexão</small>
              {dossie.alertas.length > 0 ? (
                <strong style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> {dossie.alertas.length} identificada(s)
                </strong>
              ) : (
                <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Regular
                </strong>
              )}
            </div>
          </div>

          {/* Processos Agrupados por Matéria */}
          <div className="historico-grupos">
            {Object.entries(dossie.grupos).map(([assunto, processosDoGrupo]) => {
              const temMultiplas = processosDoGrupo.length > 1;

              return (
                <div key={assunto} className="card mb-4">
                  <div className="card-h" style={{ background: temMultiplas ? 'rgba(217, 119, 6, 0.06)' : 'var(--bg-card-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color={temMultiplas ? 'var(--warning)' : 'var(--pje-blue)'} />
                      <strong style={{ fontSize: '13.5px' }}>{assunto}</strong>
                      <span className="pill pill-info" style={{ fontSize: '10.5px' }}>
                        {processosDoGrupo.length} processo(s)
                      </span>
                    </div>
                    {temMultiplas && (
                      <span className="pill pill-warn" style={{ fontSize: '11px' }}>
                        Conexão / Repetição
                      </span>
                    )}
                  </div>

                  <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="pje-table">
                      <thead>
                        <tr>
                          <th>Processo</th>
                          <th>Posição</th>
                          <th>Contraparte</th>
                          <th>Situação</th>
                          <th>Valor</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processosDoGrupo.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <NumeroProc numero={p.numero} destacar />
                              <div className="text-muted small">{fmtData(p.autuadoEm)}</div>
                            </td>
                            <td>
                              <span className={`badge-papel ${p.papel === 'Autor(a)' ? 'autor' : 'reu'}`}>
                                {p.papel}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--text-main)' }}>
                                {p.papel === 'Autor(a)'
                                  ? p.poloPassivo.map((x) => x.nome).join(', ')
                                  : p.poloAtivo.map((x) => x.nome).join(', ')}
                              </strong>
                            </td>
                            <td>
                              <span className="pill pill-info">
                                {p.situacao || (p.status === 'concluido' ? 'Arquivado' : 'Em Tramitação')}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: '600' }}>{fmtMoeda(p.valorCausa)}</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => abrirProcesso(p.id)}
                              >
                                Abrir <ArrowUpRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
