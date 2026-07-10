# Epic 4 — MCP server + first deploy

**Status**: done (July 2026). Initially blocked on a missing Cloudflare
DNS record (edge 526 while the origin was verified OK); after the user
added the proxied A record `dora.mrfrank.dev → 95.111.243.79` the site,
`/healthz` and `POST /mcp` all pass through the edge (checked 10-7-2026).
**Goal**: explorer live at https://dora.mrfrank.dev, MCP at `/mcp`.

## Design decisions

**MCP tools** (mcp/src/server.ts, dora-explorer-nl v0.1.0):
`search_dora {query, limit?, type?, instrument?}` (instrument badge in
output; reference queries "its artikel 2" work via the shared search-core),
`get_article {number, instrument?}` (default dora), `get_recital`,
`get_annex` (RoI-ITS only — the other instruments have none; annex tables
render as markdown tables), `get_structure` (all three instruments).
Amendment/recital-map tools dropped with their layers.

**Transports unchanged** from the aiact pattern: stdio + stateless
streamable HTTP (fresh server per request, JSON responses), bound
127.0.0.1:**3108**, optional `MCP_TOKEN` bearer. Data loaded once at start
from `data/generated/{dora,its,rts}/` (`DORA_DATA_DIR` override).

**Deploy**: nginx server block `/etc/nginx/sites-available/dora.mrfrank.dev`
(clone of aia's: 80→443 redirect, wildcard CF Origin cert at
`/etc/nginx/ssl/mrfrank.dev.{pem,key}`, `/mcp` proxy with buffering off +
rate limit zone `dora_mcp`, static root `/var/www/dora.mrfrank.dev` with
`try_files $uri $uri.html`); systemd user unit `dora-mcp` (nvm node path
hardcoded — update after node upgrades); `scripts/deploy-site.sh` publishes.

## Verification

- stdio: initialize + `get_article 28` returns art 28 with chapter/afdeling
  context line and deep links.
- HTTP: `/healthz` ok; JSON-RPC initialize on 127.0.0.1:3108 ok.
- Origin: `curl -k https://127.0.0.1/... -H 'Host: dora.mrfrank.dev'` serves
  the site and proxies `/mcp`; cert SAN `*.mrfrank.dev` confirmed.
- Cloudflare edge: **526** — see user action above. Re-test after the DNS
  fix: site + `POST https://dora.mrfrank.dev/mcp` + claude.ai connector e2e.

## Files

Rewritten: `mcp/src/{data,render,server}.ts` (multi-instrument),
`mcp/src/{stdio,http}.ts` + `mcp/package.json` (dora-mcp naming, port 3108),
`mcp/tsconfig.json` (+instruments.ts), `mcp/README.md`.
New: `~/.config/systemd/user/dora-mcp.service`, nginx server block (system
file, documented here).

## Risks

- Stray dev process on 3108 made the unit exit silently once — check
  `ss -tlnp | grep 3108` before restarting the unit.
- nvm node path in the unit breaks on node upgrades (same caveat as aiact).
