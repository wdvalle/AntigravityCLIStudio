#!/usr/bin/env bash
# ==============================================================================
# Antigravity CLI Studio - Script de Release e Publicação no GitHub
# 
# Funcionalidades:
# 1. Envia novos códigos e modificações para o GitHub (git add, commit, push)
# 2. Atualiza a versão em package.json e cria tag semântica (ex: v1.3.6)
# 3. Compila os binários da plataforma atual (macOS) e dispara o build
#    multiplataforma nativo (macOS, Linux e Windows) no GitHub Actions
# 4. Publica os binários diretamente no GitHub Releases
# ==============================================================================

set -e

# Cores para terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "============================================================"
echo "    🚀 Antigravity CLI Studio - Publicador de Release       "
echo "============================================================"
echo -e "${NC}"

# 1. Obter informações do repositório Git
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
  echo -e "${RED}❌ Erro: Nenhum remote 'origin' configurado no repositório Git.${NC}"
  exit 1
fi

# Extrair token GitHub do remote se disponível (ghp_...)
GITHUB_TOKEN_EXTRACTED=$(echo "$REMOTE_URL" | sed -n 's/.*:\(ghp_[^@]*\)@.*/\1/p')
TOKEN="${GITHUB_TOKEN:-$GITHUB_TOKEN_EXTRACTED}"

# Extrair owner/repo do remote
# Ex: https://github.com/wdvalle/AntigravityCLIStudio.git -> wdvalle/AntigravityCLIStudio
REPO_SLUG=$(echo "$REMOTE_URL" | sed -E 's/.*github\.com[:\/]([^\/]+)\/([^\.]+)(\.git)?/\1\/\2/')

echo -e "📦 Repositório: ${BOLD}${REPO_SLUG}${NC}"
echo -e "🌿 Branch atual: ${BOLD}${BRANCH}${NC}"

# 2. Ler versão atual do package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "🔖 Versão atual: ${BOLD}${CURRENT_VERSION}${NC}"

# Calcular sugestão de próxima versão patch (1.3.5 -> 1.3.6)
SUGGESTED_VERSION=$(node -e "
  const parts = '$CURRENT_VERSION'.split('.');
  parts[2] = (parseInt(parts[2], 10) + 1).toString();
  console.log(parts.join('.'));
")

# Parâmetros de linha de comando ou interativo
NEW_VERSION="${1:-}"
COMMIT_MSG="${2:-}"

if [ -z "$NEW_VERSION" ]; then
  echo -e "\n${YELLOW}Qual será a nova versão? (Pressione Enter para ${SUGGESTED_VERSION}):${NC}"
  read -r INPUT_VERSION
  if [ -n "$INPUT_VERSION" ]; then
    NEW_VERSION="$INPUT_VERSION"
  else
    NEW_VERSION="$SUGGESTED_VERSION"
  fi
fi

# Remover prefixo 'v' se o usuário tiver digitado 'v1.3.6'
NEW_VERSION="${NEW_VERSION#v}"
TAG_NAME="v${NEW_VERSION}"

# 3. Verificar arquivos pendentes / modificados
DIRTY_FILES=$(git status --porcelain)

if [ -n "$DIRTY_FILES" ]; then
  echo -e "\n${CYAN}📝 Alterações detectadas no repositório:${NC}"
  git status --short

  if [ -z "$COMMIT_MSG" ]; then
    echo -e "\n${YELLOW}Mensagem do commit para as alterações (Pressione Enter para 'chore: release ${TAG_NAME}'):${NC}"
    read -r INPUT_MSG
    if [ -n "$INPUT_MSG" ]; then
      COMMIT_MSG="$INPUT_MSG"
    else
      COMMIT_MSG="chore: release ${TAG_NAME}"
    fi
  fi

  echo -e "\n${CYAN}➕ Adicionando arquivos e criando commit...${NC}"
  git add -A
  git commit -m "$COMMIT_MSG"
else
  echo -e "\n${GREEN}✔ Nenhum código pendente para commit.${NC}"
fi

# 4. Atualizar package.json se a versão mudou
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
  echo -e "\n${CYAN}🔄 Atualizando package.json para versão ${NEW_VERSION}...${NC}"
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  git add package.json
  git commit -m "chore(release): bump version to ${TAG_NAME}"
fi

# 5. Criar Git Tag
echo -e "\n${CYAN}🏷️  Criando tag ${TAG_NAME}...${NC}"
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️ Tag ${TAG_NAME} já existe localmente. Atualizando apontamento...${NC}"
  git tag -f -a "$TAG_NAME" -m "Release ${TAG_NAME}"
else
  git tag -a "$TAG_NAME" -m "Release ${TAG_NAME}"
fi

# 6. Push de código e tag para o GitHub
echo -e "\n${CYAN}🚀 Enviando branch ${BRANCH} e tag ${TAG_NAME} para o GitHub...${NC}"
git push origin "$BRANCH"
git push origin "$TAG_NAME" --force
echo -e "${GREEN}✔ Código e tag enviados com sucesso para o GitHub!${NC}"

# 7. Perguntar se deseja compilar os binários localmente agora
echo -e "\n${YELLOW}Deseja compilar os binários da plataforma local (macOS) agora? (S/n):${NC}"
read -r BUILD_LOCAL_CHOICE
BUILD_LOCAL_CHOICE=${BUILD_LOCAL_CHOICE:-S}

if [[ "$BUILD_LOCAL_CHOICE" =~ ^[SsYy]$ ]]; then
  echo -e "\n${CYAN}🔨 Compilando aplicação e gerando instaladores locais...${NC}"
  npm run build
  npx electron-builder --mac
  echo -e "${GREEN}✔ Binários locais gerados no diretório release/!${NC}"
  ls -lh release/*.dmg release/*.zip 2>/dev/null || true
fi

# 8. Criar Release no GitHub e anexar binários (se houver token)
if [ -n "$TOKEN" ]; then
  echo -e "\n${CYAN}📡 Publicando release no GitHub API para ${TAG_NAME}...${NC}"
  
  RELEASE_PAYLOAD=$(cat <<EOF
{
  "tag_name": "${TAG_NAME}",
  "target_commitish": "${BRANCH}",
  "name": "Antigravity CLI Studio ${TAG_NAME}",
  "body": "### Antigravity CLI Studio ${TAG_NAME}\n\n- Binários multiplataforma gerados automaticamente para **macOS**, **Linux** e **Windows**.\n- Interface Antigravity 2.0 Obsidian Dark.\n- Internacionalização completa (pt-BR, en, es) com detecção nativa do SO.",
  "draft": false,
  "prerelease": false,
  "generate_release_notes": true
}
EOF
)

  # Criar ou obter a release existente
  RELEASE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: token ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO_SLUG}/releases" \
    -d "$RELEASE_PAYLOAD")

  UPLOAD_URL=$(echo "$RELEASE_RESPONSE" | sed -n 's/.*"upload_url": *"\([^"{]*\).*/\1/p')
  HTML_URL=$(echo "$RELEASE_RESPONSE" | sed -n 's/.*"html_url": *"\([^"]*\).*/\1/p' | head -n 1)

  # Se já existia, obter o upload_url existente
  if [ -z "$UPLOAD_URL" ]; then
    EXISTING_RELEASE=$(curl -s \
      -H "Authorization: token ${TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${REPO_SLUG}/releases/tags/${TAG_NAME}")
    UPLOAD_URL=$(echo "$EXISTING_RELEASE" | sed -n 's/.*"upload_url": *"\([^"{]*\).*/\1/p')
    HTML_URL=$(echo "$EXISTING_RELEASE" | sed -n 's/.*"html_url": *"\([^"]*\).*/\1/p' | head -n 1)
  fi

  if [ -n "$UPLOAD_URL" ]; then
    echo -e "${GREEN}✔ Release registrada no GitHub: ${HTML_URL}${NC}"

    # Fazer upload dos binários encontrados na pasta release/
    for FILE in release/*.dmg release/*.zip release/*.AppImage release/*.deb release/*.exe; do
      if [ -f "$FILE" ]; then
        FILENAME=$(basename "$FILE")
        echo -e "${CYAN}⬆️  Enviando ${FILENAME} para o GitHub Releases...${NC}"
        
        # Detectar mime-type básico
        CONTENT_TYPE="application/octet-stream"
        [[ "$FILENAME" == *.zip ]] && CONTENT_TYPE="application/zip"
        [[ "$FILENAME" == *.dmg ]] && CONTENT_TYPE="application/x-apple-diskimage"
        [[ "$FILENAME" == *.deb ]] && CONTENT_TYPE="application/vnd.debian.binary-package"
        [[ "$FILENAME" == *.exe ]] && CONTENT_TYPE="application/vnd.microsoft.portable-executable"

        curl -s -X POST \
          -H "Authorization: token ${TOKEN}" \
          -H "Content-Type: ${CONTENT_TYPE}" \
          --data-binary @"$FILE" \
          "${UPLOAD_URL}?name=${FILENAME}" >/dev/null
        
        echo -e "${GREEN}✔ ${FILENAME} publicado!${NC}"
      fi
    done
  fi
fi

echo -e "\n${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 Release ${TAG_NAME} publicada com sucesso!${NC}"
echo -e "${CYAN}Link no GitHub: ${BOLD}https://github.com/${REPO_SLUG}/releases/tag/${TAG_NAME}${NC}"
echo -e "${CYAN}Workflow Actions: ${BOLD}https://github.com/${REPO_SLUG}/actions${NC}"
echo -e "${GREEN}O GitHub Actions está compilando nativamente nas 3 plataformas (macOS, Linux, Windows) e anexando os instaladores à release.${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
