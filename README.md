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

## Bronnen (CELEX, opgehaald juli 2026)

| Instrument | Artikelen/bijlagen | Overwegingen |
|---|---|---|
| DORA | `02022R2554-20221227` (geconsolideerd) → `data/source/dora_nl_consolidated.html` | `32022R2554` (OJ) → `dora_nl_oj.html` |
| RoI-ITS | `02024R2956-20241202` (geconsolideerd, **incl. rectificatie 19-9-2025**) → `its_nl_consolidated.html` | `32024R2956` (OJ) → `its_nl_oj.html` |
| RTS onderaanneming | `32025R0532` (OJ; geen geconsolideerde versie — geen wijzigingen) → `rts_nl_oj.html` | idem |

Dialecten: geconsolideerd (DORA/ITS-artikelen; zelfde markup als het
AI-Act-project) en nieuw OJ-formaat (alle overwegingen + RTS-artikelen; de
DORA-OJ van december 2022 gebruikt al het nieuwe formaat, incl. `rct_N`-ids).
RTS-artikelnummering is de definitieve (1–7, ná schrapping van het
ontwerp-artikel 5). Alle EUR-Lex-bronnen zitten achter een AWS-WAF; ophalen
via `python3 ~/law-tracker/lib/fetch_blocked_doc.py "<url>" "<out>"`.

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
