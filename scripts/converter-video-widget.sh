#!/bin/bash
# Gera as duas versões do vídeo do card flutuante (src/components/site/VideoWidget.tsx).
#
#   ./scripts/converter-video-widget.sh /caminho/do/video.MOV
#
# São dois arquivos porque a miniatura roda em loop na vitrine inteira e não
# pode pesar, enquanto o player em tela cheia só baixa quando alguém clica:
#   institucional-preview.mp4  miniatura muda, ~125px de largura na tela
#   institucional.mp4          o que toca no player, com som
#
# A codificação é feita pelo transcodificar-video.swift, e não pelo avconvert:
# os presets do avconvert não deixam escolher o bitrate. Ver o cabeçalho de lá.
set -euo pipefail

ORIGEM="${1:?uso: $0 <arquivo-de-video>}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="$RAIZ/public/video"

mkdir -p "$DESTINO"

# 540x960 a 1,6 Mbps: o player tem ~440px de largura, que num monitor 2x pede
# perto de 900px de fonte.
swift "$RAIZ/scripts/transcodificar-video.swift" \
  "$ORIGEM" "$DESTINO/institucional.mp4" 960 1600 com-audio

# 360px de lado maior e sem áudio: o card nunca passa de 125px na tela, e o
# elemento é `muted` de qualquer jeito.
swift "$RAIZ/scripts/transcodificar-video.swift" \
  "$ORIGEM" "$DESTINO/institucional-preview.mp4" 360 260 sem-audio
