# Antigravity CLI Studio (GUI)

<div align="center">

![Antigravity CLI Studio](public/icon.png)

**Interface Gráfica Desktop Completa para o Google Antigravity CLI (`agy`) com Estilo Visual Antigravity 2.0**

[![Version](https://img.shields.io/badge/version-1.3.5-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](package.json)
[![Electron](https://img.shields.io/badge/Electron-34.2-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 📌 Visão Geral

O **Antigravity CLI Studio** é uma aplicação desktop multiplataforma (macOS, Linux e Windows) criada para proporcionar uma experiência visual moderna e intuitiva ao **Google Antigravity CLI (`agy`)**.

Inspirado na identidade visual do **Antigravity 2.0 (Obsidian Dark)**, o aplicativo transforma comandos de terminal em controles gráficos ágeis: seleção de modelos por dropdown, ajuste de nível de esforço de raciocínio, controle granular de permissões de ferramentas/comandos, gerenciamento de projetos/workspaces, catálogo de módulos (MCP, Plugins, Agentes, Skills) e editor com as 36 opções de configuração oficial.

---

## ✨ Principais Funcionalidades

### 🎨 1. Design & Experiência Antigravity 2.0
- **Tema Dark Obsidian**: Paleta refinada (`#000000`, `#0B0B0F`, `#121218`) com realces em azul elétrico (`#2F80ED`).
- **Logo Vetorial Oficial**: Ícone pulsante com animação sutil de atividade.
- **Layout em 3 Painéis**:
  - **Sidebar Esquerda**: Histórico de sessões, alternador de workspaces e atalhos rápidos.
  - **Canvas Central**: Conversação interativa, renderização de blocos de código com destaque de sintaxe e streaming de respostas.
  - **Painel Auxiliar Direito**: Contexto do projeto, status de conexão, tokens, custos e detalhes de execução.

### 🧠 2. Controle de Modelos e Permissões no Prompt
- **Seletor de Modelos (`--model`)**: Detecta e lista dinamicamente os modelos disponíveis no `agy` (`Gemini 4 Argon`, `Gemini 3.8 Flash`, `Claude Opus 5.5`, `Claude Sonnet 5.5`, `GPT-OSS 120B`, etc.).
- **Nível de Esforço de Raciocínio (`--effort`)**: Alternância rápida entre `Low`, `Medium`, `High`, `X-High` e `Max`.
- **Modo do Agente (`--mode`)**: `Default`, `Auto`, `Accept Edits` e `Plan`.
- **Políticas de Execução de Comandos (`toolPermission`)**:
  - `⚡ Automático`: Executa comandos sem confirmação prévia (`--dangerously-skip-permissions`).
  - `✋ Pedir Permissão`: Exibe cartões interativos de aprovação antes da execução de scripts e ferramentas.
  - `🔒 Sandbox`: Executa em ambiente isolado no terminal (`--sandbox`).
  - `🛡️ Modo Estrito`: Exige confirmação explícita para qualquer modificação.

### ⚙️ 3. Central de Configurações (`/config`)
- Interface completa para gerenciar as **36 opções oficiais do Antigravity CLI**.
- Sincronização bidirecional em tempo real com `~/.gemini/antigravity-cli/settings.json`.
- Busca rápida com filtros por categoria (Geral, Agente, Terminal, Políticas de Rede/Arquivo, UI).
- Alternador entre interface visual amigável e editor JSON bruto.

### 🧩 4. Ecossistema de Módulos e Extensões
- **Servidores MCP (`agy mcp`)**: Adicionar, remover, habilitar e desabilitar servidores Model Context Protocol.
- **Plugins (`agy plugin`)**: Instalação, validação, importação e remoção com um clique.
- **Subagentes (`agy agents`)**: Visualização de agentes especializados e customizados.
- **Skills & Hooks**: Gestão de habilidades de contexto e automações.
- **Controle Remoto (`agy remote-control`)**: Iniciar, monitorar status e interromper sessões remotas.

### ⚡ 5. Slash Commands Interativos
- Menu rápido acessado ao digitar `/` no prompt ou pela barra superior:
  - `/config`, `/permissions`, `/model`, `/effort`, `/compact`, `/diff`, `/skills`, `/mcp`, `/plugin`, `/agents`, `/hooks`, `/tasks`, `/usage`, `/plan`, `/goal`, `/boost`, `/teamwork`, `/grill-me`, `/learn`, `/schedule`, `/browser`, etc.

---

## 🏗️ Arquitetura do Projeto

```
AntigravityGUI/
├── electron/                  # Processo Main e Preload do Electron
│   ├── main.ts                # Inicialização de janelas, menus nativos e ciclo de vida
│   └── preload.ts             # IPC bridge segura entre Electron e Frontend
├── server/                    # Servidor local Express (API Bridge)
│   ├── index.ts               # Rotas REST e WebSocket/SSE para comunicação com o agy
│   └── agyService.ts          # Abstração de processos, leitura de configs e IPC com CLI
├── src/                       # Frontend React 19 + TypeScript + Vite
│   ├── components/            # Componentes visuais modulares
│   │   ├── AntigravityLogo.tsx
│   │   ├── CliModulesView.tsx # Telas para MCP, Plugins, Agentes e Skills
│   │   ├── ConfigView.tsx     # Central de Configuração das 36 opções
│   │   └── ProjectModal.tsx   # Modal de gerenciamento de workspaces
│   ├── services/              # Camada de comunicação com a API local
│   ├── styles/                # Folhas de estilo (tema Obsidian Dark)
│   ├── types/                 # Interfaces e definições de tipos TypeScript
│   ├── App.tsx                # Layout principal e orquestração de estados
│   └── main.tsx               # Entrypoint do React
├── public/                    # Assets estáticos e ícones
├── package.json               # Dependências e scripts de automação
├── tsconfig.json              # Configuração TypeScript do Frontend
├── tsconfig.electron.json     # Configuração TypeScript do Electron/Server
└── vite.config.ts             # Configuração do Vite Bundler
```

---

## 🚀 Como Iniciar

### Pré-requisitos
- **Node.js** (v18.0.0 ou superior)
- **npm** ou **yarn**
- **Google Antigravity CLI (`agy`)** instalado e configurado no PATH do sistema

### 1. Clonar e Instalar Dependências

```bash
git clone https://github.com/walterdovalle/AntigravityGUI.git
cd AntigravityGUI
npm install
```

### 2. Modo Desenvolvimento

#### Executar como Aplicativo Desktop (Recomendado):
Inicia simultaneamente o servidor backend local, o servidor Vite de desenvolvimento e a janela do Electron com Hot Reload:
```bash
npm run app
```

#### Executar apenas no Navegador (Web Mode):
```bash
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

---

## 📦 Compilação e Empacotamento

O projeto utiliza `electron-builder` pré-configurado para gerar instaladores otimizados para cada sistema operacional:

```bash
# Compilar TypeScript do frontend e do backend
npm run build

# Gerar instalador para macOS (.dmg e .zip)
npm run dist:mac

# Gerar instaladores para Linux (.AppImage, .deb, .tar.gz)
npm run dist:linux

# Gerar instaladores para Windows (.exe NSIS, Portable, .zip)
npm run dist:win

# Compilar para todas as plataformas de uma vez
npm run dist:all
```

Os arquivos finais serão gerados no diretório `release/`.

---

## 🛠️ Tecnologias Utilizadas

- **Desktop Framework**: [Electron 34](https://www.electronjs.org/)
- **UI Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Linguagem**: [TypeScript 5.7](https://www.typescriptlang.org/)
- **Backend Local**: [Express 4](https://expressjs.com/) + [Node.js](https://nodejs.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Empacotador**: [electron-builder 25](https://www.electron.build/)

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [`package.json`](package.json) para mais detalhes.
