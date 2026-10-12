# 🏛️ PJe+ TJCE — Painel Inteligente de Triagem e Urgências

Sistema de triagem automatizada, monitoramento de prazos regimentais (SLA), distribuição Par/Ímpar e prevenção processual para o Tribunal de Justiça do Estado do Ceará.

---

## 🚀 Como Rodar o Projeto (Passo a Passo Simples)

Você só precisa do **Node.js** instalado no seu computador ([baixe aqui se não tiver](https://nodejs.org/)).

### 1. Abra o terminal na pasta do projeto

Abra o terminal (ou prompt de comando) dentro da pasta onde você baixou este projeto.

### 2. Instale os componentes

Digite o comando abaixo e aperte **Enter**:

```bash
npm install
```

> ⏳ *Aguarde alguns segundos até o término do download das bibliotecas.*

---

### 3. Inicie o sistema

Digite o comando abaixo e aperte **Enter**:

```bash
npm run dev
```

Você verá mensagens indicando que o servidor está funcionando.

---

### 4. Como acessar no seu navegador

Depois de rodar o comando acima, o sistema já estará funcionando no seu próprio computador!

1. Abra seu navegador de internet (Chrome, Edge, Firefox, etc.).
2. Clique no link ou digite na barra de endereços:
   👉 **[http://localhost:5173](http://localhost:5173)**

> 💡 **O que é localhost?**  
> `localhost:5173` é apenas o endereço que o seu próprio computador cria para você visualizar e interagir com o sistema localmente, sem precisar de internet ou servidores externos.

---

### 5. Como desligar o sistema

Quando terminar de usar, volte na janela do terminal e aperte:
* **`Ctrl` + `C`** no teclado.

---

## 🧭 O que você pode testar no sistema

No menu lateral esquerdo, você encontrará:

1. **Painel Geral**: Visão executiva da vara com acervo, processos com prazo urgente e distribuição de carga entre servidores.
2. **Triagem & Validação**: Auditoria automática de petições iniciais (CNJ, CPF, OAB e TPU). Clique em um processo com divergência para ver os campos destacados em **amarelo** e abrir a gaveta de detalhes.
3. **Monitor de Urgências**: Acompanhamento de réus presos (prazo de 24h), prioridade de idosos e tutelas liminares com contagem regressiva em tempo real.
4. **Fila de Trabalho**: Divisão automática de processos por dígito final (Equipe Par vs Equipe Ímpar) em formato Kanban ou Tabela.
5. **Consulta de Partes**: Pesquisa unificada por CPF/CNPJ com certidão de prevenção e duplicidade de ações (arts. 55 e 286 do CPC).
6. **Assistente de Minuta (IA)**: Ao abrir qualquer processo, clique na aba **Minuta IA** e em **Gerar Minuta** para ver a pré-análise jurídica assistida por inteligência artificial com proteção de dados (LGPD).
