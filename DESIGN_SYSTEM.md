# itsbrendacleto — Design System

Sistema de design compartilhado para o app itsbrendacleto (inglês para a vida real).
Um único arquivo de tokens/componentes (`design-system.css`) alimenta os dois temas
visuais do produto: **Adulto** (elegante, tons terrosos) e **Kids** (lúdico, colorido).

## Como usar numa página

1. Importe as fontes do tema no `<head>` (Google Fonts) e o CSS do sistema:

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="design-system.css" />
```

Para páginas Kids, troque a fonte por Nunito:

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="design-system.css" />
```

2. Declare o tema no `<html>`:

```html
<html lang="pt-BR" data-theme="adulto">
<html lang="pt-BR" data-theme="kids">
```

Todo o resto (cores, tipografia, componentes) se ajusta automaticamente via
`[data-theme="adulto"]` / `[data-theme="kids"]` — o mesmo HTML/classes funcionam
nos dois temas.

3. Estilos específicos da página (layouts únicos, animações pontuais) continuam
   num `<style>` local — só o que é **compartilhado entre páginas** deve estar
   no `design-system.css`.

## Tokens

### Cor (por tema)

| Token | Adulto | Kids |
|---|---|---|
| `--color-bg` | `#FAF7F2` (cream) | `#FFF8F0` |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` |
| `--color-surface-alt` / `--color-border` | `#EDE8DF` (sand) | `#F0F0F0` |
| `--color-primary` | `#5C4033` (brown) | `#F9A8C9` (rose) |
| `--color-primary-strong` | `#8B6355` | `#F080B3` |
| `--color-on-primary` | `#FFFFFF` | `#3D2B1F` |
| `--color-text` | `#2C1F1A` | `#3D2B1F` |
| `--color-text-muted` | `#7A6560` | `rgba(61,43,31,0.6)` |
| `--color-accent-mint` | `#A8C5B5` | `#7ECBA1` |
| `--color-accent-rose` | `#E8A598` | `#F9A8C9` |
| `--color-accent-sky` | `#90C9F9` | `#90C9F9` |
| `--color-accent-yellow` | `#F0D9A0` | `#FFD97D` |
| `--color-accent-lavender` | `#C3B1E1` | `#C3B1E1` |

Estados semânticos (iguais nos dois temas, exceto o `neutral` que segue o
tom de superfície do tema): `--color-success-bg/text`, `--color-danger-bg/text`,
`--color-warning-bg/text`, `--color-neutral-bg/text`.

### Tipografia

| Token | Adulto | Kids |
|---|---|---|
| `--font-display` | `DM Serif Display` | `Nunito` (peso 900) |
| `--font-body` | `DM Sans` | `Nunito` |
| `--weight-medium` / `--weight-bold` / `--weight-heavy` | 500 / 600 / 700 | 700 / 800 / 900 |

Use `.font-display` (ou `h1`/`h2`/`h3`) para títulos, texto normal herda `--font-body`.

### Espaçamento, raio, sombra

- Espaçamento em escala de 4px: `--space-1` (4px) até `--space-8` (32px).
- Raio: `--radius-sm` 8px, `--radius-md` 10px, `--radius-lg` 16px, `--radius-xl` 20px, `--radius-full` 999px.
  Componentes tipo cartão usam `--radius-card`, que já resolve para o valor certo por tema (16px adulto / 20px kids).
- Sombra: `--shadow-sm/md/lg` para uso geral; `--shadow-card` / `--shadow-card-hover` para cards que seguem o "peso visual" do tema.

## Catálogo de componentes

Todos os componentes abaixo já existem em `design-system.css` e funcionam nos
dois temas sem alteração de classe — só o `data-theme` no `<html>` muda a aparência.

- **`.ds-header` / `.ds-header-brand` / `.btn-logout`** — cabeçalho fixo com marca e ação de sair.
- **`.card`** — cartão base genérico (usado em telas de login/formulário).
- **`.brand` / `.brand-name` / `.brand-tagline` / `.divider-dot`** — bloco de marca centralizado (splash/login).
- **`.form-group`, `input[type=...]`, `.ds-input`** — campos de formulário com foco estilizado.
- **`.btn-primary`, `.btn-secondary`** — botão de ação principal e botão outline/secundário (ex: login com Google).
- **`.or-divider`** — divisor "ou" entre duas opções de ação.
- **`.message.error` / `.message.success`** — alertas inline.
- **`.loading`** — spinner pequeno para estado de carregamento em botões.
- **`.hero` / `.hero-inner` / `.hero-top` / `.hero-name` / `.hero-chips` / `.hero-chip`** — cabeçalho de boas-vindas da home.
- **`.avatar-wrap` / `.avatar-img` / `.avatar-placeholder` / `.avatar-edit`** — avatar do usuário com edição.
- **`.teacher-strip` / `.teacher-avatar-wrap` / `.teacher-name`** — cartão da professora responsável.
- **`.menu-grid` / `.menu-card` / `.menu-icon` / `.menu-title` / `.menu-badge`** — grade de navegação por ícones (com variantes de cor `.c-rose/.c-mint/.c-yellow/.c-lavender/.c-sky` e `.menu-icon.rose/...` para o tema Kids).
- **`.progress-card` / `.progress-bar` / `.progress-fill`** — barra de progresso do aluno.
- **`.agenda-card` / `.agenda-row` / `.agenda-status`** — lista de próximas aulas com status (`.pendente`, `.realizada`, `.cancelada`, `.reagendada`, `.para_reagendar`).
- **`.profile-option`** — item de seleção de perfil (ex: escolher aluno numa conta compartilhada).

## Diretrizes para novas páginas (e para o Claude)

1. **Nunca redefina cor/fonte/raio direto** — sempre pelos tokens (`var(--color-primary)`
   etc.), nunca hex/px soltos, para que o tema continue trocável.
2. **Reuse componentes existentes antes de criar um novo.** Se a página precisa de
   algo parecido com `.card`/`.menu-card`/`.agenda-status`, estenda-os em vez de
   duplicar CSS local.
3. **Só vá para `design-system.css` o que é genuinamente compartilhado** (2+ páginas).
   Layout específico de uma tela (ex: o jogo de uma aula, um gráfico de relatório)
   fica no `<style>` local da própria página.
4. **Ambos os temas devem funcionar com o mesmo HTML.** Ao criar um componente novo,
   pense em como ele se comporta em `data-theme="adulto"` e `data-theme="kids"` antes
   de dar como pronto.
5. **Ícones são emoji**, não SVG/ícone-font — mantenha esse padrão para consistência
   com o resto do produto.

## Status de adoção

Aplicado como prova de conceito em `index.html`, `home-adulto.html` e `home-kids.html`.
As demais ~47 páginas (aulas, dashboards, painel da professora, planners, etc.) ainda usam
CSS local duplicado e podem ser migradas incrementalmente — ao editar qualquer uma delas,
prefira importar `design-system.css` e remover os tokens/componentes que ele já cobre.
