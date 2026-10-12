import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.API_PORT || 3001);
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const KEY = process.env.GROQ_API_KEY;

const SYSTEM = `Você é um assessor jurídico experiente de uma vara do Tribunal de Justiça do Estado do Ceará (TJCE).
Sua tarefa é redigir MINUTAS PRELIMINARES de despacho ou decisão para revisão do analista e do magistrado.
Regras:
- Escreva em português jurídico formal, claro e objetivo.
- Use APENAS os fatos informados. Nunca invente nomes, datas, documentos ou números. Para lacunas use [COMPLETAR].
- Os dados pessoais (CPF/CNPJ) foram anonimizados por LGPD; não os mencione.
- Estruture em: CABEÇALHO (Processo, Classe, Assunto), RELATÓRIO (breve), FUNDAMENTAÇÃO, DISPOSITIVO.
- Tutela de urgência: analise probabilidade do direito e perigo de dano (art. 300 do CPC).
- Réu preso: analise legalidade da prisão e requisitos dos arts. 312 e 313 do CPP, e cabimento de medidas cautelares diversas (art. 319 do CPP).
- Idoso: mencione a prioridade de tramitação (art. 1.048, I, do CPC e Estatuto da Pessoa Idosa).
- Se houver pendências de cadastro, inclua determinação de emenda/regularização (art. 321 do CPC).
- Termine com "Expedientes necessários." e local/data como "[Comarca], [data]." e "Juiz(a) de Direito".
- Não use markdown pesado: apenas títulos em CAIXA ALTA e parágrafos.`;

function anonimizar(p) {
  const parte = (x) => ({
    nome: x.nome,
    tipo: x.tipo,
    idade: x.idade ?? null,
    advogado: x.advogado ? { nome: x.advogado.nome } : null,
  });
  return {
    numero: p.numero,
    classe: p.classe,
    assunto: p.assunto,
    vara: p.vara,
    valorCausa: p.valorCausa,
    reuPreso: !!p.reuPreso,
    estabelecimentoPrisional: p.estabelecimentoPrisional || null,
    tutelaUrgencia: !!p.tutelaUrgencia,
    urgencia: p.urgencia?.label || null,
    poloAtivo: (p.poloAtivo || []).map(parte),
    poloPassivo: (p.poloPassivo || []).map(parte),
    pendenciasCadastro: (p.pendencias || []).map((e) => e.msg),
    historicoPartes: p.historicoPartes || null,
    resumoPeticao: p.resumo,
  };
}

function montarPrompt(p) {
  return `Elabore a minuta preliminar adequada para o processo abaixo (dados em JSON):

${JSON.stringify(anonimizar(p), null, 2)}

Gere somente o texto da minuta.`;
}

function fallback(p) {
  const urg = p.reuPreso
    ? 'Tratando-se de réu preso, o feito tramita com prioridade absoluta, devendo ser analisada a legalidade e a necessidade da custódia (arts. 312, 313 e 319 do CPP).'
    : p.tutelaUrgencia
      ? 'Há pedido de tutela de urgência, cuja análise exige a demonstração da probabilidade do direito e do perigo de dano (art. 300 do CPC).'
      : 'Não há pedido de urgência.';
  const pend = (p.pendencias || []).length
    ? `\n\nVerificadas as seguintes pendências de cadastro: ${(p.pendencias || []).map((e) => e.msg).join('; ')}. Intime-se a parte autora para emendar a inicial no prazo de 15 (quinze) dias, sob pena de indeferimento (art. 321 do CPC).`
    : '';
  return `DESPACHO

Processo nº ${p.numero}
Classe: ${p.classe}
Assunto: ${p.assunto}

RELATÓRIO
${p.resumo || '[COMPLETAR]'}

FUNDAMENTAÇÃO
${urg}${pend}

DISPOSITIVO
Ante o exposto, [COMPLETAR conforme análise do(a) magistrado(a)].

Expedientes necessários.

[Comarca], [data].

Juiz(a) de Direito

— Minuta gerada por modelo local (IA indisponível). Revisão obrigatória.`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ia: Boolean(KEY), modelo: KEY ? MODEL : 'modelo-local' });
});

app.post('/api/minuta', async (req, res) => {
  const p = req.body?.processo;
  if (!p) return res.status(400).json({ erro: 'Processo não informado.' });

  const t0 = Date.now();
  if (!KEY) {
    return res.json({ minuta: fallback(p), modelo: 'modelo-local', fallback: true, ms: Date.now() - t0 });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.25,
        max_tokens: 3000,
        ...(MODEL.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: montarPrompt(p) },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Groq HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    const minuta = j.choices?.[0]?.message?.content?.trim();
    if (!minuta) throw new Error('Resposta vazia da IA');
    res.json({ minuta, modelo: MODEL, ms: Date.now() - t0, tokens: j.usage?.total_tokens });
  } catch (e) {
    console.error('[minuta]', e.message);
    res.json({ minuta: fallback(p), modelo: 'modelo-local', fallback: true, erro: e.message, ms: Date.now() - t0 });
  }
});

app.listen(PORT, () => {
  console.log(`API PJe+ rodando em http://localhost:${PORT}  (IA: ${KEY ? MODEL : 'desativada'})`);
});
