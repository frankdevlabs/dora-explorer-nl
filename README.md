# DORA Explorer (NL)

Doorzoekbare Nederlandse tekst van **DORA — Verordening (EU) 2022/2554**
(digitale operationele weerbaarheid financiële sector), samen met de
RoI-ITS (Uitvoeringsverordening (EU) 2024/2956, informatieregister) en de
onderaannemings-RTS (Gedelegeerde Verordening (EU) 2025/532). Daarnaast:

- **Assessment (entiteit)** — welk DORA-regime en welke verplichtingen gelden
  voor de financiële entiteit (art. 4/16-proportionaliteit).
- **Assessment (leverancier)** — per ICT-overeenkomst: ondersteunt de dienst
  een kritieke of belangrijke functie (art. 3, punt 22) en welke
  verplichtingen gelden dan (art. 28–30, RTS 2025/532).
- **Informatieregister** — invulhulp voor het register van art. 28, lid 3
  (ITS-templates B_01.01–B_99.01) met CSV-export per template en een
  leveranciersuitvraag voor velden die alleen de keten kent.

Volledig statische Next.js-site (`output: 'export'`), geen database. Zoeken
gebeurt client-side met MiniSearch over een build-time index (Ctrl+K / ⌘K).
Geporteerd van [ai-act-explorer-nl](https://github.com/frankdevlabs/ai-act-explorer-nl).

## Bronnen (CELEX)

_Wordt ingevuld bij epic 1 (source survey): geconsolideerde DORA-tekst,
OJ-preambule, ITS 2024/2956 (incl. rectificatie 19-9-2025), RTS 2025/532._
Alle EUR-Lex-bronnen zitten achter een AWS-WAF; ophalen via
`python3 ~/law-tracker/lib/fetch_blocked_doc.py "<url>" "<out>"`.

## Ontwikkelen

```bash
npm install
npm run dev -- -p 3107   # of: tmux new-session -d -s dora-dev 'npm run dev -- -p 3107'
npm run build            # parse → verify → next build (statische export in out/)
```

## Voor ontwikkelaars

Zie [`AGENTS.md`](AGENTS.md) (werkinstructies, conventies) en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (parser, EUR-Lex-HTML-dialecten,
datamodel, zoekindex — geërfd van het AI-Act-project, wordt per epic
bijgewerkt). Features en status: [`docs/epics/`](docs/epics/).

## Deeplinks

Elk lid en punt is deeplinkbaar: `/artikel/28#lid-3`, `/its/bijlage/i`.

## Bron & disclaimer

Geen officiële weergave; raadpleeg
[EUR-Lex](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) voor de authentieke
tekst.
