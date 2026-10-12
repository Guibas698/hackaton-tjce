import { useState, useEffect } from 'react';
import { UserSearch, Search, AlertTriangle, ShieldCheck, Building2, User, FileText, ChevronRight, History } from 'lucide-react';
import { useStore } from '../lib/store';
import { NumeroProc, SlaBadge } from '../components/ui';
import { buscarPartes, montarDossie } from '../lib/rules';
import { fmtMoeda, fmtData } from '../lib/format';

export default function Dossie() {
  const { todos, dossieAlvo, setDossieAlvo, abrirProcesso } = useStore();
  const [termo, setTermo] = useState(dossieAlvo || '123456789'); // padrão: CPF de Dona Maria
  const [chaveSelecionada, setChaveSelecionada] = useState(dossieAlvo || '');

  const sugestoes = termo ? buscarPartes(termo, todos) : [];

  useEffect(() => {
    if (dossieAlvo) {
      setTermo(dossieAlvo);
      setChaveSelecionada(dossieAlvo);
    }
  }, [dossieAlvo]);

  const dossie = chaveSelecionada ? montarDossie(chaveSelecionada, todos) : null;

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h2>Dossiê Unificado de Partes ("Efeito Dona Maria")</h2>
          <p className="subtext">
            Raio-X instantâneo por CPF/CNPJ com histórico unificado de ações, prevenção por matéria e litigância repetitiva.
          </p>
        </div>
      </div>

      <div className="search-section card p-4 mb-4">
        <label className="text-muted small mb-2 d-block">Buscar parte por Nome ou CPF/CNPJ:</label>
        <div className="search-input-group">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Ex: Maria das Graças, Banco Horizonte, ou digite o CPF..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>

        {sugestoes.length > 0 && (
          <div className="sugestoes-grid mt-3">
            <span className="small text-muted d-block mb-1">Partes encontradas na base:</span>
            <div className="chips-list">
              {sugestoes.map((s, idx) => (
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
                  <span className="badge-count">{s.total} ações</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {dossie && (
        <div className="dossie-results">
          {dossie.alertas.length > 0 && (
            <div className="alerta-prevencao mb-4">
              <div className="alerta-header">
                <AlertTriangle size={20} />
                <strong>Alerta de Prevenção e Litigância Mapeada (arts. 55 e 286 do CPC)</strong>
              </div>
              <ul className="alerta-lista">
                {dossie.alertas.map((alt, idx) => (
                  <li key={idx} className={alt.forte ? 'alerta-grave' : ''}>
                    {alt.texto}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="dossie-stats-bar card p-3 mb-4">
            <div className="stat-item">
              <small className="text-muted">Total de Ações Localizadas</small>
              <strong>{dossie.lista.length} processos</strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Como Autora / Ativa</small>
              <strong>{dossie.lista.filter((x) => x.papel === 'Autor(a)').length}</strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Como Ré / Passiva</small>
              <strong>{dossie.lista.filter((x) => x.papel !== 'Autor(a)').length}</strong>
            </div>
            <div className="stat-item">
              <small className="text-muted">Assuntos Distintos</small>
              <strong>{Object.keys(dossie.grupos).length} matérias</strong>
            </div>
          </div>

          <div className="historico-grupos">
            {Object.entries(dossie.grupos).map(([assunto, processosDoGrupo]) => (
              <div key={assunto} className="grupo-card card mb-4">
                <div className="grupo-header">
                  <div className="grupo-titulo">
                    <FileText size={18} />
                    <strong>Matéria: {assunto}</strong>
                    <span className="badge-grupo">{processosDoGrupo.length} processo(s)</span>
                  </div>
                </div>

                <div className="grupo-tabela-wrap">
                  <table className="pje-table">
                    <thead>
                      <tr>
                        <th>Processo</th>
                        <th>Papel</th>
                        <th>Contraparte</th>
                        <th>Situação / Fase</th>
                        <th>Valor da Causa</th>
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
                            {p.papel === 'Autor(a)'
                              ? p.poloPassivo.map((x) => x.nome).join(', ')
                              : p.poloAtivo.map((x) => x.nome).join(', ')}
                          </td>
                          <td>
                            <span className="badge-situacao">
                              {p.situacao || (p.status === 'concluido' ? 'Arquivado' : 'Em tramitação')}
                            </span>
                            {p.resultado && <div className="text-muted small">{p.resultado}</div>}
                          </td>
                          <td>{fmtMoeda(p.valorCausa)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => abrirProcesso(p.id)}
                            >
                              Ver no PJe <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
