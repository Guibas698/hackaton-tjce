# 🏛️ PJe+ TJCE — Módulo de Inteligência & Triagem Inteligente
## Status da Implementação e Validação

> **Status Atual**: MVP 100% implementado, testado com Browser Agent, refatorado seguindo rigorosamente critérios de IHC e Design Institucional do TJCE, sem textos de propaganda/pitch e com commits sincronizados no repositório.

---

### 🚀 1. Resumo das Últimas Refatorações e Correções

1. **Eliminação Integral de Textos Promocionais e "Claims de Pitch"**:
   - **Removido**: Banners de propaganda do tipo *"eliminação manual antes os estagios 95% mais rapido"*, *"De 5 min para 0.5s"*, *"Antes levavam 8 min no Excel"*.
   - **Removido**: Bloco de texto citado especificamente pelo usuário (*"Garantia de Cumprimento de Prazos Legais (ODS 16 - CNJ)... notificado automaticamente no Teams no segundo da distribuição"*).
   - **Removido**: Menções a "Funcionalidade 1/2/3", "pitch", "demonstração" e "simulação" em botões, modais e tooltips.
   - **Resultado**: A interface agora se comporta e se apresenta como um sistema judicial real, oficial e institucional do PJe 2.x / TJCE.

2. **Resolução das Quebras de Layout (IHC & Responsividade)**:
   - **Diagnóstico da Quebra**: O bloco do usuário (`Paula Mendes · Diretora de Secretaria`) quebrava ou era empurrado para fora da tela porque a barra superior (`.topbar`) acumulava títulos longos redundantes com os cabeçalhos das páginas e flex children sem controle de encolhimento.
   - **Solução Implementada**:
     - `.topbar` padronizada com `white-space: nowrap; flex-shrink: 0;`.
     - Título limpo e conciso sem subtítulos duplicados no cabeçalho.
     - `.user` fixado com `white-space: nowrap; flex-shrink: 0; min-width: max-content;` impedindo qualquer quebra vertical do avatar ou nome.
     - Campo de busca com largura calibrada (210px–250px) e contração responsiva.

3. **Correção Estrutural da Gaveta Lateral (ProcessDrawer)**:
   - **Diagnóstico**: O elemento `.overlay` estava sem `position: fixed` no CSS, fazendo com que o drawer abrisse no fluxo normal da página e esmagasse a tabela e os cabeçalhos.
   - **Solução Implementada**:
     - `.overlay` e `.drawer-ov` configurados com `position: fixed; inset: 0; backdrop-filter: blur(4px); z-index: 1000;`.
     - O drawer agora desliza suavemente sobre a página sem alterar a largura de nenhum elemento do fundo.

4. **Validação das 4 Funcionalidades do Hackathon**:
   - **Funcionalidade 1 (Validação Cadastral & Triagem)**: Auditoria instantânea de CNJ (módulo 97), CPF/CNPJ, regularidade de OAB e TPU, com destaque em amarelo para campos com inconsistência e botão para expedição de intimação (art. 321 CPC).
   - **Funcionalidade 2 (Monitor de Urgências e SLA)**: Relógios de contagem regressiva em tempo real com priorização visual rígida para Réus Presos (24h), Idosos 80+ (24h) e Tutelas de Urgência (72h), com integração de alerta Teams.
   - **Funcionalidade 3 (Fila de Trabalho & Par/Ímpar)**: Divisão de processos por final de dígito CNJ (Par: 0, 2, 4, 6, 8 / Ímpar: 1, 3, 5, 7, 9) com visualização em Kanban de Fases, Comparativo Split e Lista/Tabela.
   - **Funcionalidade 4 (Dossiê Unificado & Certidão de Prevenção)**: Busca integrada de partes com detecção automática de conexão e prevenção judicial (arts. 55 e 286 do CPC) em casos de litigância repetitiva.
   - **Bônus (Assistente de IA)**: Servidor Express em `server/index.js` integrado à Groq com geração de minutas preliminares juridicamente fundamentadas e anonimização de dados pessoais (LGPD).

---

### 💻 2. Como Rodar o Sistema Localmente

```bash
# Instalar dependências
npm install

# Subir frontend (Vite) e backend (Express) em conjunto
npm run dev
```

* **Frontend**: `http://localhost:5173/`
* **API de IA**: `http://localhost:3001/api/health`

---

### 🔒 3. Segurança e Repositório
* **Repositório Git**: `https://github.com/VictorFCos/hackaton-tjce.git` (ramo `main`).
* **Segredos**: Chaves de API (`.env`) e prints de teste (`prints/`) estão devidamente ignorados no `.gitignore`.
