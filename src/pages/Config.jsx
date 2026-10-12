import { Settings, Sliders, Bell, Users, Shield } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar } from '../components/ui';

export default function Config() {
  const { state, dispatch, toast } = useStore();

  const handleSlaChange = (campo, valor) => {
    dispatch({
      type: 'CONFIG',
      patch: {
        sla: { [campo]: Number(valor) },
      },
    });
  };

  const handleModoChange = (modo) => {
    dispatch({
      type: 'CONFIG',
      patch: { modo },
    });
    toast({ tipo: 'success', titulo: 'Regra de distribuição atualizada!' });
  };

  const handleCanalToggle = (canal) => {
    dispatch({
      type: 'CONFIG',
      patch: {
        canais: { [canal]: !state.config.canais[canal] },
      },
    });
  };

  return (
    <div className="page-content">
      <div className="page-header-row">
        <div>
          <h2>Configurações do Sistema</h2>
          <p className="subtext">
            Parametrização das regras de negócio, prazos de SLA, canais de alerta e equipes da vara.
          </p>
        </div>
      </div>

      <div className="config-grid">
        <div className="card p-4">
          <div className="card-h mb-3">
            <h3><Sliders size={18} /> Regra de Distribuição da Fila</h3>
          </div>
          <p className="small text-muted mb-3">
            Define como novos processos capturados do PJe são repartidos entre os servidores da vara:
          </p>
          <div className="radio-group">
            <label className="radio-card">
              <input
                type="radio"
                name="modo"
                value="par_impar"
                checked={state.config.modo === 'par_impar'}
                onChange={() => handleModoChange('par_impar')}
              />
              <div>
                <strong>Pares e Ímpares (Padrão TJCE)</strong>
                <p className="small text-muted">
                  Separação por final do número do processo com balanceamento de carga interno no time.
                </p>
              </div>
            </label>

            <label className="radio-card">
              <input
                type="radio"
                name="modo"
                value="round_robin"
                checked={state.config.modo === 'round_robin'}
                onChange={() => handleModoChange('round_robin')}
              />
              <div>
                <strong>Rodízio Equitativo (Round-Robin)</strong>
                <p className="small text-muted">
                  Distribuição puramente sequencial equilibrando o volume de casos ativos.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="card p-4">
          <div className="card-h mb-3">
            <h3><Shield size={18} /> Prazos SLA de Urgência (Horas)</h3>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Réu Preso</label>
              <input
                type="number"
                className="input-text"
                value={state.config.sla.reuPreso}
                onChange={(e) => handleSlaChange('reuPreso', e.target.value)}
              />
              <small className="text-muted">Horas para conclusão</small>
            </div>
            <div className="form-group">
              <label>Idoso 80+ anos</label>
              <input
                type="number"
                className="input-text"
                value={state.config.sla.idoso80}
                onChange={(e) => handleSlaChange('idoso80', e.target.value)}
              />
              <small className="text-muted">Prioridade absoluta</small>
            </div>
            <div className="form-group">
              <label>Idoso 60+ anos</label>
              <input
                type="number"
                className="input-text"
                value={state.config.sla.idoso}
                onChange={(e) => handleSlaChange('idoso', e.target.value)}
              />
              <small className="text-muted">Estatuto da Pessoa Idosa</small>
            </div>
            <div className="form-group">
              <label>Tutela de Urgência</label>
              <input
                type="number"
                className="input-text"
                value={state.config.sla.tutela}
                onChange={(e) => handleSlaChange('tutela', e.target.value)}
              />
              <small className="text-muted">Art. 300 do CPC</small>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="card-h mb-3">
            <h3><Bell size={18} /> Canais Ativos de Notificação</h3>
          </div>
          <div className="checkbox-list">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={state.config.canais.teams}
                onChange={() => handleCanalToggle('teams')}
              />
              <div>
                <strong>Microsoft Teams (Alertas Push)</strong>
                <p className="small text-muted">Aviso instantâneo para o analista no momento da atribuição.</p>
              </div>
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={state.config.canais.email}
                onChange={() => handleCanalToggle('email')}
              />
              <div>
                <strong>E-mail Institucional (@tjce.jus.br)</strong>
                <p className="small text-muted">Disparo de resumo de processos urgentes.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="card p-4">
          <div className="card-h mb-3">
            <h3><Users size={18} /> Equipe da Vara (Analistas Cadastrados)</h3>
          </div>
          <div className="analistas-grid">
            {state.analistas.map((an) => (
              <div key={an.id} className="analista-item-card">
                <Avatar nome={an.nome} cor={an.cor} size={32} />
                <div className="analista-info">
                  <strong>{an.nome}</strong>
                  <div className="small text-muted">{an.cargo}</div>
                  <div className="small">Equipe: <b className="capitalize">{an.equipe}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
