import { Settings, Sliders, Bell, Users, Shield, RotateCcw, Check, Sparkles, Database } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, TeamsLogo } from '../components/ui';

export default function Config() {
  const { state, dispatch, toast } = useStore();

  const handleSlaChange = (campo, valor) => {
    dispatch({
      type: 'CONFIG',
      patch: {
        sla: { [campo]: Math.max(1, Number(valor) || 1) },
      },
    });
  };

  const handleModoChange = (modo) => {
    dispatch({
      type: 'CONFIG',
      patch: { modo },
    });
    toast({ tipo: 'success', titulo: 'Regra de distribuição atualizada com sucesso!' });
  };

  const handleCanalToggle = (canal) => {
    dispatch({
      type: 'CONFIG',
      patch: {
        canais: { [canal]: !state.config.canais[canal] },
      },
    });
    toast({ tipo: 'info', titulo: 'Canais de notificação atualizados.' });
  };

  const toggleAnalistaAtivo = (id, ativoAtual) => {
    dispatch({
      type: 'ANALISTA',
      id,
      patch: { ativo: !ativoAtual },
    });
    toast({ tipo: 'info', titulo: `Servidor marcado como ${!ativoAtual ? 'em exercício' : 'ausente/afastado'}.` });
  };

  const resetarDemo = () => {
    if (window.confirm('Deseja restaurar a base de processos para o estado inicial?')) {
      dispatch({ type: 'RESET' });
      toast({ tipo: 'success', titulo: 'Base de processos restaurada para o padrão inicial.' });
    }
  };

  return (
    <div className="page-content">
      {/* Cabeçalho da Página com IHC */}
      <div className="page-header-row">
        <div>
          <h2>Parametrização & Configurações da Vara</h2>
          <p className="subtext">
            Ajuste de prazos regimentais de SLA, regras de distribuição Par/Ímpar, servidores ativos e integrações do TJCE.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm btn-outline" onClick={resetarDemo} title="Restaura a base de dados padrão">
            <RotateCcw size={14} /> Restaurar Base Padrão
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
        {/* Regra de Distribuição */}
        <div className="card p-4">
          <div className="card-h" style={{ margin: '-24px -24px 20px -24px' }}>
            <h3><Sliders size={18} color="var(--pje-blue)" /> Regra de Distribuição de Processos</h3>
          </div>
          <p className="small text-muted mb-3">
            Escolha o algoritmo utilizado pela Secretaria da Vara ao receber novos processos via MNI/PJe:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: state.config.modo === 'par_impar' ? '2px solid var(--pje-blue)' : '1px solid var(--border-color)',
                background: state.config.modo === 'par_impar' ? 'var(--pje-blue-light)' : 'var(--bg-main)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="modo"
                value="par_impar"
                checked={state.config.modo === 'par_impar'}
                onChange={() => handleModoChange('par_impar')}
                style={{ marginTop: '3px' }}
              />
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                  Pares e Ímpares Parametrizável (Padrão TJCE)
                </strong>
                <p className="small text-muted" style={{ marginTop: '2px' }}>
                  Baseado no último dígito do sequencial (NNNNNN<strong>X</strong>). Processos com final par vão para a Equipe Par; final ímpar vão para a Equipe Ímpar, mantendo equilíbrio interno de carga.
                </p>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: state.config.modo === 'round_robin' ? '2px solid var(--pje-blue)' : '1px solid var(--border-color)',
                background: state.config.modo === 'round_robin' ? 'var(--pje-blue-light)' : 'var(--bg-main)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="modo"
                value="round_robin"
                checked={state.config.modo === 'round_robin'}
                onChange={() => handleModoChange('round_robin')}
                style={{ marginTop: '3px' }}
              />
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                  Rodízio Equitativo (Round-Robin Balanceado)
                </strong>
                <p className="small text-muted" style={{ marginTop: '2px' }}>
                  Distribuição puramente sequencial entre todos os servidores em atividade na secretaria, independente do número do processo.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Prazos de SLA */}
        <div className="card p-4">
          <div className="card-h" style={{ margin: '-24px -24px 20px -24px' }}>
            <h3><Shield size={18} color="var(--danger)" /> Prazos Regimentais de SLA (em Horas)</h3>
          </div>
          <p className="small text-muted mb-3">
            Defina o tempo limite máximo para análise antes que o alerta visual e sonoro de estouro de prazo seja acionado:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="campo">
              <label>Réu Preso (CPP / Liberdade)</label>
              <input
                type="number"
                min="1"
                max="72"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                value={state.config.sla.reuPreso}
                onChange={(e) => handleSlaChange('reuPreso', e.target.value)}
              />
              <small className="text-muted" style={{ marginTop: '2px', fontSize: '10px' }}>Padrão: 24h (Risco Absoluto)</small>
            </div>

            <div className="campo">
              <label>Idoso 80+ anos (Superprioridade)</label>
              <input
                type="number"
                min="1"
                max="72"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                value={state.config.sla.idoso80}
                onChange={(e) => handleSlaChange('idoso80', e.target.value)}
              />
              <small className="text-muted" style={{ marginTop: '2px', fontSize: '10px' }}>Padrão: 24h (Lei 13.466/17)</small>
            </div>

            <div className="campo">
              <label>Idoso 60+ anos (Estatuto)</label>
              <input
                type="number"
                min="1"
                max="120"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                value={state.config.sla.idoso}
                onChange={(e) => handleSlaChange('idoso', e.target.value)}
              />
              <small className="text-muted" style={{ marginTop: '2px', fontSize: '10px' }}>Padrão: 48h (CPC art. 1.048)</small>
            </div>

            <div className="campo">
              <label>Tutela de Urgência (Geral)</label>
              <input
                type="number"
                min="1"
                max="120"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                value={state.config.sla.tutela}
                onChange={(e) => handleSlaChange('tutela', e.target.value)}
              />
              <small className="text-muted" style={{ marginTop: '2px', fontSize: '10px' }}>Padrão: 72h (CPC art. 300)</small>
            </div>
          </div>
        </div>

        {/* Canais de Notificação */}
        <div className="card p-4">
          <div className="card-h" style={{ margin: '-24px -24px 20px -24px' }}>
            <h3><Bell size={18} color="var(--violet)" /> Canais Ativos de Notificação</h3>
          </div>
          <p className="small text-muted mb-3">
            Alertas disparados instantaneamente no momento da atribuição de urgência:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={state.config.canais.teams}
                onChange={() => handleCanalToggle('teams')}
              />
              <TeamsLogo size={22} />
              <div>
                <strong style={{ fontSize: '13px' }}>Microsoft Teams (Push / Pop-up)</strong>
                <small className="text-muted d-block">Notifica diretamente o analista e o canal da vara sobre Réu Preso.</small>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={state.config.canais.email}
                onChange={() => handleCanalToggle('email')}
              />
              <div style={{ width: '22px', height: '22px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>@</div>
              <div>
                <strong style={{ fontSize: '13px' }}>E-mail Institucional (@tjce.jus.br)</strong>
                <small className="text-muted d-block">Envio de relatório periódico das tutelas atribuídas.</small>
              </div>
            </label>
          </div>
        </div>

        {/* Servidores Cadastrados */}
        <div className="card p-4">
          <div className="card-h" style={{ margin: '-24px -24px 20px -24px' }}>
            <h3><Users size={18} color="var(--gold)" /> Servidores da Vara (Equipes Par e Ímpar)</h3>
          </div>
          <p className="small text-muted mb-3">
            Servidores em plantão ou férias podem ser ativados/desativados do algoritmo:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {state.analistas.map((an) => (
              <div
                key={an.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  opacity: an.ativo ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar nome={an.nome} cor={an.cor} size={32} />
                  <div>
                    <strong style={{ fontSize: '13px' }}>{an.nome}</strong>
                    <div className="small text-muted">
                      {an.cargo} · Equipe <strong style={{ textTransform: 'capitalize' }}>{an.equipe}</strong>
                    </div>
                  </div>
                </div>

                <button
                  className={`btn btn-sm ${an.ativo ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => toggleAnalistaAtivo(an.id, an.ativo)}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  {an.ativo ? 'Em Exercício' : 'Afastado / Férias'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
