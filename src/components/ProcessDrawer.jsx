import { useEffect, useMemo, useState } from 'react';
import {
  X, Copy, AlertTriangle, CheckCircle2, Sparkles, FileText, Users, History, Send, RefreshCw, Loader2, Gavel,
  UserSearch, Lock, Scale, Building2, User,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, NumeroProc, PendenciaPill, SlaBadge, RingCountdown, EquipeTag } from './ui';
import { STATUS, equipeDoNumero, historicoDasPartes } from '../lib/rules';
import { fmtDataHora, fmtMoeda, fmtData } from '../lib/format';
import { idade } from '../lib/validators';

const ABAS = [
  { id: 'dados', label: 'Dados & Cadastro', icone: FileText },
  { id: 'partes', label: 'Partes & Dossiê', icone: Users },
  { id: 'minuta', label: 'Minuta IA', icone: Sparkles },
  { id: 'historico', label: 'Histórico', icone: History },
];

export default function ProcessDrawer() {
  const { abertoId, fecharProcesso, processos, todos, abaDrawer, setAbaDrawer, analistaPorId, toast } = useStore();
  const p = processos.find((x) => x.id === abertoId);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && fecharProcesso();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fecharProcesso]);

  const hist = useMemo(() => (p ? historicoDasPartes(p, todos) : []), [p, todos]);
  if (!p) return null;
  const erroEm = (path) => p.pendencias.find((e) => e.path === path);
  const an = analistaPorId[p.analistaId];

  return (
    <div className="overlay drawer-ov" onMouseDown={(e) => e.target === e.currentTarget && fecharProcesso()}>
      <aside className={`drawer ${p.urgencia ? `urg-${p.urgencia.nivel}` : ''}`}>
        <header className="dr-h">
          <div className="dr-top">
            <span className="dr-kicker">
              <Scale size={14} /> {p.vara}
            </span>
            <button className="icon-btn" onClick={fecharProcesso} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="dr-main">
            <div>
              <div className={`dr-num ${erroEm('numero') ? 'hl-warn' : ''}`} title={erroEm('numero')?.msg}>
                <NumeroProc numero={p.numero} destacar />
                <button
                  className="icon-btn sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(p.numero);
                    toast({ tipo: 'success', titulo: 'Número copiado' });
                  }}
                  title="Copiar número"
                >
                  <Copy size={14} />
                </button>
              </div>
              <h2>{p.classe}</h2>
              <p className="dr-sub">{p.assunto}</p>
              <div className="dr-tags">
                {p.urgencia && <SlaBadge u={p.urgencia} />}
                {p.urgencia?.tutela && p.urgencia.tipo !== 'TUTELA' && <span className="pill pill-orange">Tutela de urgência</span>}
                <PendenciaPill n={p.pendencias.length} />
                {p.cadastroCorrigido && (
                  <span className="pill pill-ok">
                    <CheckCircle2 size={12} /> Cadastro regularizado
                  </span>
                )}
                {p.emendaSolicitada && !p.cadastroCorrigido && <span className="pill pill-info">Emenda solicitada</span>}
              </div>
            </div>
            {p.urgencia && <RingCountdown u={p.urgencia} />}
          </div>
          <nav className="tabs">
            {ABAS.map((a) => {
              const Ic = a.icone;
              return (
                <button key={a.id} id={`aba-${a.id}`} className={abaDrawer === a.id ? 'ativo' : ''} onClick={() => setAbaDrawer(a.id)}>
                  <Ic size={15} /> {a.label}
                  {a.id === 'dados' && p.pendencias.length > 0 && <em className="tab-dot" />}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="dr-body">
          {abaDrawer === 'dados' && <AbaDados p={p} an={an} erroEm={erroEm} />}
          {abaDrawer === 'partes' && <AbaPartes p={p} erroEm={erroEm} hist={hist} />}
          {abaDrawer === 'minuta' && <AbaMinuta p={p} hist={hist} />}
          {abaDrawer === 'historico' && (
            <ol className="timeline">
              {[...(p.historicoEventos || [])].reverse().map((e, i) => (
                <li key={i}>
                  <span className="tl-dot" />
                  <div>
                    <strong>{e.texto}</strong>
                    <small>{fmtDataHora(e.em)}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

function Campo({ rotulo, children, erro, mono }) {
  return (
    <div className={`campo ${erro ? 'hl-warn' : ''}`} title={erro?.msg}>
      <label>
        {rotulo} {erro && <AlertTriangle size={12} />}
      </label>
      <div className={mono ? 'mono' : ''}>{children}</div>
      {erro && <small className="campo-erro">{erro.msg}</small>}
    </div>
  );
}

function AbaDados({ p, an, erroEm }) {
  const { dispatch, state, toast } = useStore();
  const equipe = equipeDoNumero(p.numero);
  return (
    <>
      {p.pendencias.length > 0 && (
        <div className="box-warn">
          <div className="bw-h">
            <AlertTriangle size={18} />
            <div>
              <strong>{p.pendencias.length} pendência(s) de cadastro detectadas automaticamente</strong>
              <small>Campos destacados em amarelo. Antes, isso era conferido à mão na planilha.</small>
            </div>
          </div>
          <ul>
            {p.pendencias.map((e, i) => (
              <li key={i}>
                <b>{e.campo}:</b> {e.msg}
              </li>
            ))}
          </ul>
          <div className="bw-actions">
            <button
              className="btn btn-warn"
              disabled={p.emendaSolicitada}
              onClick={() => {
                dispatch({
                  type: 'EMENDA',
                  id: p.id,
                  notificacao: { id: `e${Date.now()}`, canal: 'email', titulo: `Intimação para emenda · ${p.numero}`, corpo: `Enviada ao(à) ${p.poloAtivo[0]?.advogado?.nome || 'patrono(a)'} via Diário/Domicílio Eletrônico`, processoId: p.id, em: new Date().toISOString(), lida: false },
                });
                toast({ tipo: 'email', titulo: 'Intimação para emenda expedida', corpo: 'Advogado notificado (art. 321 do CPC) — simulação' });
              }}
            >
              <Send size={15} /> {p.emendaSolicitada ? 'Emenda já solicitada' : 'Intimar para emenda (art. 321 CPC)'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                dispatch({ type: 'CORRIGIR', id: p.id });
                toast({ tipo: 'success', titulo: 'Cadastro regularizado' });
              }}
            >
              <CheckCircle2 size={15} /> Marcar como corrigido
            </button>
          </div>
        </div>
      )}
      {p.pendencias.length === 0 && (
        <div className="box-ok">
          <CheckCircle2 size={18} /> Cadastro validado automaticamente: número CNJ, documentos, OAB e TPU conferem.
        </div>
      )}

      <div className="grid-campos">
        <Campo rotulo="Número (CNJ)" erro={erroEm('numero')} mono>
          {p.numero}
        </Campo>
        <Campo rotulo="Autuado em">{fmtDataHora(p.autuadoEm)}</Campo>
        <Campo rotulo="Classe judicial">{p.classe}</Campo>
        <Campo rotulo="Assunto (TPU)" erro={erroEm('assunto')}>
          {p.assunto}
        </Campo>
        <Campo rotulo="Valor da causa" erro={erroEm('valorCausa')}>
          {fmtMoeda(p.valorCausa)}
        </Campo>
        {p.reuPreso ? (
          <Campo rotulo="Unidade prisional" erro={erroEm('estabelecimentoPrisional')}>
            {p.estabelecimentoPrisional || 'Não informada'}
          </Campo>
        ) : (
          <Campo rotulo="Tutela de urgência">{p.tutelaUrgencia ? 'Sim — pedido liminar' : 'Não'}</Campo>
        )}
      </div>

      <h4 className="sec-t">Distribuição e andamento</h4>
      <div className="grid-campos">
        <div className="campo">
          <label>Regra aplicada</label>
          <div className="regra">
            <NumeroProc numero={p.numero} destacar /> <EquipeTag equipe={equipe} />
          </div>
        </div>
        <div className="campo">
          <label>Analista responsável</label>
          <div className="sel-wrap">
            {an && <Avatar nome={an.nome} cor={an.cor} size={24} />}
            <select id="sel-analista" value={p.analistaId || ''} onChange={(e) => dispatch({ type: 'ATRIBUIR', id: p.id, analistaId: e.target.value })}>
              {state.analistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.equipe === 'par' ? 'Par' : 'Ímpar'})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="campo span2">
          <label>Etapa</label>
          <div className="seg">
            {STATUS.map((s) => (
              <button key={s.id} className={p.status === s.id ? 'ativo' : ''} style={{ '--c': s.cor }} onClick={() => dispatch({ type: 'MOVER', id: p.id, status: s.id })}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h4 className="sec-t">Resumo da petição</h4>
      <p className="resumo">{p.resumo}</p>
    </>
  );
}

function ParteCard({ parte, path, erroEm, h, polo }) {
  const { abrirDossie } = useStore();
  const id = idade(parte.dataNascimento);
  const Ic = parte.tipo === 'PJ' ? Building2 : User;
  return (
    <div className="parte">
      <div className="parte-h">
        <span className="parte-ic">
          <Ic size={16} />
        </span>
        <div>
          <strong>{parte.nome}</strong>
          <small>{polo}</small>
        </div>
        {id !== null && id >= 60 && <span className="pill pill-red">Idoso · {id} anos</span>}
      </div>
      <div className="grid-campos compact">
        <Campo rotulo={parte.tipo === 'PJ' ? 'CNPJ' : 'CPF'} erro={erroEm(`${path}.doc`)} mono>
          {parte.doc || '—'}
        </Campo>
        {parte.tipo !== 'PJ' && (
          <Campo rotulo="Nascimento" erro={erroEm(`${path}.dataNascimento`)}>
            {parte.dataNascimento ? `${fmtData(parte.dataNascimento)} (${id} anos)` : '—'}
          </Campo>
        )}
        <Campo rotulo="CEP" erro={erroEm(`${path}.cep`)} mono>
          {parte.cep || '—'}
        </Campo>
        {(parte.advogado || erroEm(`${path}.advogado`)) && (
          <Campo rotulo="Advogado(a) / OAB" erro={erroEm(`${path}.advogado.oab`) || erroEm(`${path}.advogado`)}>
            {parte.advogado ? (
              <>
                {parte.advogado.nome} · <span className="mono">{parte.advogado.oab}</span>
              </>
            ) : (
              'Não constituído'
            )}
          </Campo>
        )}
      </div>
      {h && (
        <button className={`dossie-link ${h.mesmoAssunto ? 'alerta' : ''}`} onClick={() => abrirDossie(h.chave)}>
          <UserSearch size={15} />
          {h.anteriores ? (
            <span>
              <b>{h.anteriores}</b> processo(s) anteriores{h.mesmoAssunto ? <> · <b>{h.mesmoAssunto}</b> com o mesmo assunto — possível prevenção</> : ''}
            </span>
          ) : (
            <span>Sem processos anteriores nesta vara</span>
          )}
          <em>Ver dossiê →</em>
        </button>
      )}
    </div>
  );
}

function AbaPartes({ p, erroEm, hist }) {
  const histDe = (parte) => hist.find((h) => h.nome === parte.nome);
  return (
    <>
      <h4 className="sec-t">Polo ativo</h4>
      {p.poloAtivo.map((x, i) => (
        <ParteCard key={i} parte={x} path={`poloAtivo.${i}`} erroEm={erroEm} h={histDe(x)} polo="Polo ativo" />
      ))}
      <h4 className="sec-t">Polo passivo</h4>
      {p.poloPassivo.map((x, i) => (
        <ParteCard key={i} parte={x} path={`poloPassivo.${i}`} erroEm={erroEm} h={histDe(x)} polo="Polo passivo" />
      ))}
    </>
  );
}

function AbaMinuta({ p, hist }) {
  const { dispatch, toast } = useStore();
  const [carregando, setCarregando] = useState(false);
  const [info, setInfo] = useState(null);

  const gerar = async () => {
    setCarregando(true);
    setInfo(null);
    try {
      const historicoPartes = hist.filter((h) => h.anteriores).map((h) => `${h.nome}: ${h.anteriores} processo(s) anteriores, ${h.mesmoAssunto} sobre o mesmo assunto`);
      const r = await fetch('/api/minuta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processo: {
            ...p,
            historicoPartes,
            poloAtivo: p.poloAtivo.map((x) => ({ ...x, idade: idade(x.dataNascimento) })),
            poloPassivo: p.poloPassivo.map((x) => ({ ...x, idade: idade(x.dataNascimento) })),
          },
        }),
      });
      const j = await r.json();
      dispatch({ type: 'MINUTA', id: p.id, texto: j.minuta, modelo: j.modelo });
      setInfo(j);
    } catch {
      toast({ tipo: 'info', titulo: 'Servidor de IA indisponível', corpo: 'Rode "npm run dev" para subir a API.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="minuta-wrap">
      <div className="ia-hero">
        <div className="ia-ic">
          <Sparkles size={20} />
        </div>
        <div>
          <strong>Pré-análise com IA generativa</strong>
          <small>
            Lê a petição, as urgências, as pendências e o histórico das partes, e sugere a minuta preliminar. <Lock size={11} /> CPF/CNPJ são removidos antes do envio (LGPD).
          </small>
        </div>
        <button id="btn-gerar-minuta" className="btn btn-ia" onClick={gerar} disabled={carregando}>
          {carregando ? <Loader2 size={16} className="spin" /> : p.minuta ? <RefreshCw size={16} /> : <Sparkles size={16} />}
          {carregando ? 'Gerando…' : p.minuta ? 'Gerar novamente' : 'Gerar minuta'}
        </button>
      </div>

      {carregando && (
        <div className="papel skeleton">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ width: `${60 + ((i * 37) % 40)}%` }} />
          ))}
        </div>
      )}

      {!carregando && p.minuta && (
        <>
          <div className="papel">
            <div className="papel-h">
              <Gavel size={16} /> Poder Judiciário do Estado do Ceará · {p.vara}
            </div>
            <pre>{p.minuta.texto}</pre>
            <div className="papel-f">Minuta gerada por IA · revisão humana obrigatória</div>
          </div>
          <div className="minuta-actions">
            <small>
              Modelo: <b>{p.minuta.modelo}</b>
              {info?.ms ? ` · ${(info.ms / 1000).toFixed(1)}s` : ''}
              {info?.fallback ? ' · (modelo local de contingência)' : ''}
            </small>
            <button
              className="btn btn-ghost"
              onClick={() => {
                navigator.clipboard?.writeText(p.minuta.texto);
                toast({ tipo: 'success', titulo: 'Minuta copiada' });
              }}
            >
              <Copy size={15} /> Copiar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: 'MOVER', id: p.id, status: 'minuta' });
                toast({ tipo: 'success', titulo: 'Enviado para assinatura', corpo: 'Processo movido para "Minuta / Assinatura"' });
              }}
            >
              <Send size={15} /> Enviar para assinatura
            </button>
          </div>
        </>
      )}

      {!carregando && !p.minuta && (
        <div className="vazio">
          <FileText size={34} strokeWidth={1.4} />
          <strong>Nenhuma minuta gerada</strong>
          <p>Clique em “Gerar minuta” para a IA preparar um rascunho de despacho/decisão.</p>
        </div>
      )}
    </div>
  );
}
