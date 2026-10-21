# Antigravity CLI Studio (GUI)

Aplicação desktop multiplataforma completa (Linux, Windows e macOS) que funciona como uma interface gráfica (GUI) para o **Google Antigravity CLI (`agy`)**, seguindo o estilo visual do **Antigravity App (2.0)**.

## Principais Funcionalidades

1. **Estilo Visual Antigravity 2.0**:
   - Tema Dark Obsidian (`#000000` / `#0B0B0F` / `#121218`) com destaque em azul elétrico (`#2F80ED`), logo vetorial oficial do Antigravity com animação de pulso e layout em 3 painéis (Sidebar Esquerda, Chat Canvas Central e Painel Auxiliar Direito).
2. **Combo de Modelo e Controle de Permissão Abaixo do Prompt**:
   - **Combo de Escolha de Modelo (`--model`)**: Lista todos os modelos do `agy models` (`Gemini 4 Argon`, `Gemini 3.8 Flash`, `Claude Opus 5.5`, `Claude Sonnet 5.5`, `GPT-OSS 120B`).
   - **Seletor de Permissão de Execução de Comandos (`toolPermission`)**: Permite alternar imediatamente abaixo do prompt entre:
     - `⚡ Comandos: Automático (always-proceed / --dangerously-skip-permissions)` — Executa comandos automaticamente sem pedir confirmação.
     - `✋ Comandos: Pedir Permissão ao Usuário (request-review)` — Exibe um cartão interativo de aprovação antes da execução de comandos.
     - `🔒 Comandos: Automático em Sandbox (proceed-in-sandbox / --sandbox)` — Executa dentro do sandbox de terminal.
     - `🛡️ Comandos: Modo Estrito (strict)` — Exige aprovação explícita.
   - **Combo de Esforço (`--effort`)** (`Low`, `Medium`, `High`, `X-High`, `Max`) e **Modo de Agente (`--mode`)** (`Default`, `Auto`, `Accept Edits`, `Plan`).
3. **Tela Completa para `/config` (36 Opções)**:
   - Digitar `/config` no prompt ou clicar em **Configurações (`/config`)** abre uma tela completa com todas as **36 opções oficiais do Antigravity CLI** sincronizadas em tempo real com `~/.gemini/antigravity-cli/settings.json`, incluindo filtro de busca, abas por categoria e editor JSON bruto.
4. **Todos os Comandos do CLI como Itens de Interface**:
   - **Slash Commands (`/`)**: Menu interativo e barra superior com `/config`, `/permissions`, `/model`, `/effort`, `/compact`, `/btw`, `/diff`, `/skills`, `/mcp`, `/plugin`, `/agents`, `/hooks`, `/tasks`, `/usage`, `/credits`, `/changelog`, `/help`, `/clear`, `/rewind`, `/fork`, `/copy`, `/plan`, `/goal`, `/boost`, `/teamwork`, `/grill-me`, `/learn`, `/schedule`, `/browser`.
   - **Subcomandos do CLI**: Telas dedicadas para `agy models`, `agy mcp` (`list`, `add`, `remove`, `enable`, `disable`), `agy plugin` (`list`, `install`, `uninstall`, `enable`, `disable`, `validate`, `import`), `agy agents`, `agy remote-control` (`start`, `status`, `stop`), `agy changelog`, `agy update` e `agy install`.

## Como Executar em Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo Desktop (Electron + Vite + Backend Local)
npm run app

# Ou iniciar em modo Web (acessível em http://localhost:5173)
npm run dev
```

## Como Compilar para Linux, Windows e macOS

O projeto utiliza `electron-builder` configurado para empacotar a mesma base de código para Linux, Windows e macOS:

```bash
# Compilar apenas os bundles TypeScript + Vite
npm run build

# Gerar instaladores para Linux (.AppImage, .deb, .tar.gz) em release/
npm run dist:linux

# Gerar instaladores para Windows (.exe NSIS, .exe Portable, .zip) em release/
npm run dist:win

# Gerar pacote para macOS (.dmg, .zip) em release/
npm run dist:mac

# Compilar para todas as plataformas (Linux, Windows e macOS)
npm run dist:all
```
