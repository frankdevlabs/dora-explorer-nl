# DORA Explorer (NL)

Doorzoekbare Nederlandse tekst van **DORA — Verordening (EU) 2022/2554**
(digitale operationele weerbaarheid financiële sector), samen met **alle
twaalf gepubliceerde level-2-handelingen** (RTS'en, ITS'en en gedelegeerde
handelingen — zie de brontabel hieronder), onderling gekruisverwezen.
Daarnaast:

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
| Risicobeheer-RTS | `02024R1774-20240625` (geconsolideerd, **incl. beide rectificaties 2025**) → `risicobeheer_nl_consolidated.html` | `32024R1774` (OJ) → `risicobeheer_nl_oj.html` |
| Classificatie-RTS | `32024R1772` (OJ) → `classificatie_nl_oj.html` | idem |
| Rapportage-RTS | `32025R0301` (OJ) → `rapportage_nl_oj.html` | idem |
| Rapportage-ITS | `32025R0302` (OJ) → `formulieren_nl_oj.html` | idem |
| TLPT-RTS | `32025R1190` (OJ) → `tlpt_nl_oj.html` | idem |
| Beleids-RTS | `32024R1773` (OJ) → `contractbeleid_nl_oj.html` | idem |
| Criticaliteitscriteria | `32024R1502` (OJ) → `criticaliteit_nl_oj.html` | idem |
| Oversightvergoedingen | `32024R1505` (OJ) → `vergoedingen_nl_oj.html` | idem |
| Oversight-RTS | `32025R0295` (OJ) → `oversight_nl_oj.html` | idem |
| Onderzoeksteams-RTS | `32025R0420` (OJ) → `onderzoeksteams_nl_oj.html` | idem |

Dialecten: geconsolideerd (DORA/ITS/1774-artikelen; zelfde markup als het
AI-Act-project) en nieuw OJ-formaat (alle overwegingen + de overige
artikelen/bijlagen; de DORA-OJ van december 2022 gebruikt al het nieuwe
formaat, incl. `rct_N`-ids). RTS-artikelnummering is de definitieve (1–7,
ná schrapping van het ontwerp-artikel 5). 2024/1774 nest hoofdstukken in
titels (`tis_II.cpt_I`) — dat corpus is bewust plat. Alle EUR-Lex-bronnen
zitten achter een AWS-WAF; ophalen via
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

Elk lid en punt is deeplinkbaar: `/artikel/28#lid-3`, `/its-register/bijlage/i`.

## Bron & disclaimer

Geen officiële weergave; raadpleeg
[EUR-Lex](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) voor de authentieke
tekst.
