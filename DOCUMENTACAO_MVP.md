# 🏛️ PJe+ TJCE — Documentação Técnica do MVP

> **Guia para o Modelo de IA / Desenvolvedor**: Este documento detalha a arquitetura, regras de negócio e estado atual da implementação para facilitar a continuidade do desenvolvimento e aprimoramento do MVP.

---

## 📌 1. Visão Geral do Produto
O **PJe+** é uma suíte de melhorias nativas desenvolvida para o **PJe do Tribunal de Justiça do Ceará (TJCE)**, focada em eliminar o uso de planilhas manuais (Excel) em varas judiciais através de 4 funcionalidades principais integradas:

1. **Ingestão & Validação de Cadastro**: Leitura automática de petições com realce em **amarelo** para dados inconsistentes (CNJ, CPF/CNPJ, OAB, TPU do CNJ, CEP).
2. **Motor de SLA de Urgências (24h/48h)**: Identificação em tempo real de **Réu Preso** (SLA 24h) e **Prioridade Idoso** (24h/48h) com cronômetros regressivos visuais e disparos simulados para o Microsoft Teams.
3. **Fila Par/Ímpar Automatizada**: Distribuição balanceada de processos com base no final do sequencial do número CNJ com visualização em **Kanban** e Tabela.
4. **Dossiê Unificado de Partes ("Efeito Dona Maria")**: Consulta instantânea por CPF/CNPJ gerando árvore completa de processos e detecção de **prevenção e litigância repetitiva** (arts. 55 e 286 do CPC).
5. **Pré-análise com IA Generativa**: Minuta automática de despacho para o magistrado/analista com anonimização prévia de dados pessoais (LGPD).

---

## 🗂️ 2. Estrutura de Diretórios e Arquivos

```text
├── .env                  # Chave Groq e configurações locais (NUNCA commitada, ignorada no git)
├── .env.example          # Modelo seguro de variáveis de ambiente para repositório
├── package.json          # Scripts e dependências (React 18, Vite 5, Lucide, Express)
├── server/
│   └── index.js          # Servidor Express (proxy seguro Groq com remoção de CPF/CNPJ para LGPD)
├── src/
│   ├── main.jsx          # Ponto de entrada React com StoreProvider
│   ├── App.jsx           # Layout principal, roteador de abas e componentes globais
│   ├── index.css         # Identidade visual TJCE/PJe, tema claro/escuro e layout
│   ├── lib/
│   │   ├── validators.js # Cálculos reais de CNJ (mód 97), CPF, CNPJ, OAB e CEP
│   │   ├── rules.js      # Tabelas TPU, regras de SLA, regras Par/Ímpar e motor do dossiê
│   │   ├── mockData.js   # Dados fictícios realistas da Vara de Aracati/CE
│   │   ├── store.jsx     # Gerenciamento de estado (useReducer + localStorage) e pipeline de ingestão
│   │   └── format.js     # Formatação de datas, moedas, cronômetros e iniciais
│   ├── components/
│   │   ├── Shell.jsx     # Sidebar, Topbar com busca global e Toasts estilo Teams
│   │   ├── ui.jsx        # Badges de SLA com countdown ativo, Rings, Avatares, Tags
│   │   ├── IngestModal.jsx # Modal com animação de captura do PJe sem digitação
│   │   └── ProcessDrawer.jsx # Gaveta lateral com realce de erros em amarelo e gerador de minuta IA
│   └── pages/
│       ├── Painel.jsx    # Dashboard executivo com KPIs, gráfico semanal e gargalos
│       ├── Triagem.jsx   # Funcionalidade 1: Tabela de cadastros e intimação de emenda
│       ├── Urgencias.jsx # Funcionalidade 2: Painel de SLA com relógios para Réu Preso/Idoso
│       ├── Fila.jsx      # Funcionalidade 3: Visão Kanban e Tabela com filtros Par/Ímpar
│       ├── Dossie.jsx    # Funcionalidade 4: Busca por CPF com árvore de histórico e prevenção
│       └── Config.jsx    # Painel de parametrização de prazos e distribuição
```

---

## ⚙️ 3. Regras de Negócio Implementadas

### A. Regra Par/Ímpar
* **Local**: `src/lib/rules.js` (`equipeDoNumero` e `escolherAnalista`).
* **Critério**: O último dígito do sequencial do número CNJ (`NNNNNN*N*-DD.AAAA.J.TR.OOOO`).
  * Dígito par $\rightarrow$ Equipe Par (ex: Ana Beatriz Lima, Carlos Rocha).
  * Dígito ímpar $\rightarrow$ Equipe Ímpar (ex: Juliana Freitas, Rafael Monteiro).
* **Balanceamento**: O sistema atribui o caso ao analista do time respectivo com a menor carga de processos pendentes.

### B. Motor de SLA de Urgências
* **Local**: `src/lib/rules.js` (`calcularUrgencia`).
* **Prioridades**:
  1. **Réu Preso**: 24 horas (crítico).
  2. **Idoso 80+ anos**: 24 horas (prioridade especial).
  3. **Idoso 60+ anos**: 48 horas (alta prioridade).
  4. **Tutela de Urgência**: 72 horas (média).
* **Feedback Visual**: Crachás coloridos com contadores em tempo real e relógios decrescentes no `src/components/ui.jsx` e `src/components/ProcessDrawer.jsx`.

### C. Validação de Cadastro (Destaque Amarelo)
* **Local**: `src/lib/rules.js` (`validarProcesso`).
* Inconsistências apontadas:
  * Dígito verificador do processo errado (Resolução CNJ 65/2008).
  * Assunto não pertencente à classe processual segundo a TPU do CNJ.
  * CPF ou CNPJ com dígito verificador inválido ou em branco.
  * Ausência de advogado constituído (quando exigido) ou OAB fora do padrão.
  * CEP inválido ou réu preso sem unidade prisional descrita.
* **Ação integrada**: Permite disparar intimação automática para emenda da inicial (art. 321 do CPC).

### D. Dossiê "Dona Maria"
* **Local**: `src/lib/rules.js` (`montarDossie` e `buscarPartes`).
* Agrupa todos os processos em que o CPF/CNPJ figurou no polo ativo ou passivo.
* Gera alertas de **prevenção por conexão** caso existam ações anteriores com a mesma contraparte e matéria.

---

## 🚀 4. Como Executar o Projeto

```bash
# Rodar frontend e backend simultaneamente:
npm run dev

# Ou separadamente:
npm run dev:web  # Frontend (Vite) na porta 5173
npm run dev:api  # Backend IA (Express) na porta 3001
```

O build de produção foi testado e validado via `npm run build` com sucesso.
