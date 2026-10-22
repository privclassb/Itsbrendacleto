# Mission 00 — Diagnostic Flight Check (Helicopter Pilot Edition)

Aula diagnóstica de 60 minutos do curso **ICAO English Preparation**, independente das demais aulas da plataforma.

## Arquivos

```
mission00/
├── mission00-diagnostic-flight-check.html   ← apresentação do aluno (12 telas)
├── mission00-teacher-guide.html             ← Teacher Guide (consulta, separado)
├── audio/                                   ← 6 áudios MP3 da aula
├── images/                                  ← 8 fotografias + manifest.json
├── CREDITS.md                               ← autores e licenças de imagens e áudios
└── README.md
```

Mantenha a pasta inteira junta: o HTML usa caminhos relativos (`audio/…`, `images/…`).

## Como usar na aula

1. Abra `mission00-diagnostic-flight-check.html` no navegador e compartilhe **somente esta aba/janela** na chamada (marque "compartilhar áudio da aba" para o aluno ouvir os áudios).
2. Clique em "Guia da prof." no topo da tela (ou pressione **G**) para abrir o Teacher Guide em uma janela separada.
3. O guia acompanha automaticamente a tela atual da apresentação ("Seguir a apresentação").

Atalhos: **← / →** navegar · **F** tela cheia · **G** Teacher Guide · **Esc** fechar imagem ampliada.
Também é possível abrir uma tela específica pelo endereço: `…flight-check.html#screen-5`.

## Integração com a plataforma

- Pode ser publicado como página estática (pasta inteira) ou incorporado via `<iframe>`.
  Em iframe, use `allow="fullscreen; autoplay"` e `allowfullscreen` para o modo tela cheia funcionar.
- O Teacher Guide deve ficar em rota acessível apenas à professora (ex.: área administrativa). O nome do arquivo é referenciado pela tecla G; se mudar a rota, atualize a função `openGuide()` no HTML da apresentação.
- Nada é armazenado: sem formulários, notas, gravações ou relatórios. O registro diagnóstico será feito na área do perfil do aluno.

## Áudios

Os seis áudios foram gerados com o motor de síntese de voz open-source **Kokoro-82M** (licença Apache 2.0, uso comercial permitido), com textos idênticos aos roteiros. Cada arquivo foi conferido por transcrição automática.

Para substituir um áudio (por exemplo, por uma gravação humana), salve o novo MP3 em `audio/` **com o mesmo nome**. Se um arquivo estiver ausente, o player mostra "AUDIO FILE UNAVAILABLE" em vez de um botão que pareça funcionar.

## Imagens

As fotos ficam em `images/` e são declaradas no bloco `IMAGES` dentro do HTML da apresentação (cópia em `images/manifest.json`). Para trocar uma foto, substitua o arquivo e atualize autor/licença no bloco `IMAGES` e no `CREDITS.md`. Uma imagem ausente aparece como "IMAGE PENDING".
