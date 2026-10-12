import { AlertTriangle, Siren, Timer, HeartPulse, ShieldAlert } from 'lucide-react';
import { useNow } from '../lib/store';
import { fmtRestante, iniciais, partesNumero } from '../lib/format';

export function Avatar({ nome, cor = '#0078AA', size = 30, title }) {
  return (
    <span className="avatar" style={{ '--c': cor, width: size, height: size, fontSize: size * 0.38 }} title={title || nome}>
      {iniciais(nome)}
    </span>
  );
}

export function NumeroProc({ numero, destacar = false }) {
  if (!destacar) return <span className="mono num">{numero}</span>;
  const { antes, digito, depois } = partesNumero(numero);
  const par = Number(digito) % 2 === 0;
  return (
    <span className="mono num">
      {antes}
      <b className={`digito ${par ? 'par' : 'impar'}`} title={`Último dígito do sequencial: ${digito} → ${par ? 'Par' : 'Ímpar'}`}>
        {digito}
      </b>
      {depois}
    </span>
  );
}

const ICONES = { REU_PRESO: Siren, IDOSO_80: HeartPulse, IDOSO: HeartPulse, TUTELA: ShieldAlert };

export function estadoSla(u, now) {
  if (!u) return null;
  const restante = u.prazo - now;
  const frac = restante / (u.horas * 3600e3);
  const estado = restante <= 0 ? 'vencido' : frac < 0.25 ? 'critico' : frac < 0.5 ? 'atencao' : 'ok';
  return { restante, frac: Math.max(0, Math.min(1, frac)), estado };
}

export function SlaBadge({ u, mostrarTempo = true, grande = false }) {
  const now = useNow(1000);
  if (!u) return null;
  const Ic = ICONES[u.tipo] || Timer;
  const { restante, estado } = estadoSla(u, now);
  return (
    <span className={`sla sla-${u.tipo.toLowerCase()} est-${estado} ${grande ? 'sla-lg' : ''}`}>
      <span className="sla-tag">
        <Ic size={grande ? 15 : 12} strokeWidth={2.5} />
        {u.label}
      </span>
      {mostrarTempo && (
        <span className="sla-time mono">
          {estado === 'vencido' ? 'VENCIDO ' : ''}
          {fmtRestante(restante)}
        </span>
      )}
    </span>
  );
}

export function RingCountdown({ u, size = 92 }) {
  const now = useNow(1000);
  const { restante, frac, estado } = estadoSla(u, now);
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <div className={`ring est-${estado}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div className="ring-txt">
        <span className="mono">{fmtRestante(restante).replace(/:\d\d$/, '')}</span>
        <small>{estado === 'vencido' ? 'vencido' : 'restantes'}</small>
      </div>
    </div>
  );
}

export function PendenciaPill({ n, compacto }) {
  if (!n) return null;
  return (
    <span className="pill pill-warn" title={`${n} pendência(s) de cadastro`}>
      <AlertTriangle size={12} strokeWidth={2.5} />
      {compacto ? n : `${n} pendência${n > 1 ? 's' : ''}`}
    </span>
  );
}

export function EquipeTag({ equipe }) {
  return <span className={`equipe eq-${equipe}`}>{equipe === 'par' ? 'Par' : 'Ímpar'}</span>;
}

export function TeamsLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Microsoft Teams">
      <circle cx="23" cy="9" r="4" fill="#7B83EB" />
      <rect x="17" y="14" width="13" height="12" rx="4" fill="#7B83EB" />
      <circle cx="14" cy="8" r="5" fill="#5059C9" />
      <rect x="6" y="14" width="16" height="14" rx="4" fill="#5059C9" />
      <rect x="2" y="9" width="14" height="14" rx="2.5" fill="#4B53BC" />
      <path d="M5.5 12.5h7v1.8H10V20H8v-5.7H5.5z" fill="#fff" />
    </svg>
  );
}

export function Card({ titulo, icone: Ic, acao, children, className = '', id }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(titulo || acao) && (
        <header className="card-h">
          <h3>
            {Ic && <Ic size={17} />}
            {titulo}
          </h3>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Vazio({ icone: Ic, titulo, texto }) {
  return (
    <div className="vazio">
      {Ic && <Ic size={34} strokeWidth={1.5} />}
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
    </div>
  );
}
