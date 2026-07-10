# dora-mcp — MCP server for DORA Explorer NL

Exposes the Dutch DORA corpus (Verordening (EU) 2022/2554 + RoI-ITS
2024/2956 + onderaannemings-RTS 2025/532) over the Model Context Protocol:
stdio for Claude Desktop/Code, streamable HTTP for claude.ai custom
connectors.

Search relevance is identical to the site: both use
`src/lib/search-core.ts` (MiniSearch config, Dutch normalization, snippets).

## Tools

| Tool | Input | Returns |
|---|---|---|
| `search_dora` | `query`, `limit?`, `type?`, `instrument?` | hits with deep links + snippets |
| `get_article` | `number`, `instrument?` (default `dora`) | full article text |
| `get_recital` | `number`, `instrument?` | recital text |
| `get_annex` | `roman` (`"III"`, RoI-ITS only) | annex text incl. template tables |
| `get_structure` | — | compact TOC of all three instruments |

All output is markdown with deep links to `BASE_URL` so Claude can cite.

## Build

```sh
cd mcp
npm install
npm run build       # tsc → dist/ (compiled CommonJS)
```

Layout note: `rootDir` is the repo root (the build compiles
`src/lib/{types,search-core}.ts` alongside), so entrypoints land at
`dist/mcp/src/{stdio,http}.js` and the shared libs at `dist/src/lib/`.
The whole build is CommonJS — the repo root `package.json` has no
`"type": "module"`, so the cross-compiled `src/lib` files must be CJS and the
`mcp` sources follow suit.

## Claude Desktop / Claude Code (stdio)

```json
{
  "mcpServers": {
    "dora-nl": {
      "command": "node",
      "args": ["/home/supergoose/dora-explorer-nl/mcp/dist/mcp/src/stdio.js"]
    }
  }
}
```

## Remote (streamable HTTP)

- Endpoint: `https://dora.mrfrank.dev/mcp` (claude.ai → Settings → Connectors →
  Add custom connector). Stateless: no session ids, JSON responses, safe to
  restart the service at any time.
- `GET /healthz` for liveness; `GET`/`DELETE /mcp` return 405 by design.

### Env vars

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3108` | listen port (binds 127.0.0.1) |
| `BASE_URL` | `https://dora.mrfrank.dev` | prefix for deep links in output |
| `MCP_TOKEN` | unset | if set, require `Authorization: Bearer` (Claude API MCP connector / Agents). Leave unset for claude.ai custom connectors — they have no static-token field. |
| `DORA_DATA_DIR` | `<repo>/data/generated` | corpus location override |

## Deployment (this VPS)

systemd user unit `~/.config/systemd/user/dora-mcp.service`
(linger is enabled):

```sh
systemctl --user daemon-reload
systemctl --user enable --now dora-mcp
systemctl --user status dora-mcp
curl -s 127.0.0.1:3108/healthz
```

nginx: `/etc/nginx/sites-available/dora.mrfrank.dev` proxies `/mcp` →
`127.0.0.1:3108` (buffering off, 300s read timeout) and serves the static
site from `/var/www/dora.mrfrank.dev` (publish with `scripts/deploy-site.sh`).
TLS = Cloudflare Origin CA cert (`/etc/nginx/ssl/mrfrank.dev.{pem,key}`),
zone SSL mode Full (strict).

Fallback without systemd: `tmux new-session -d -s dora-mcp 'node /home/supergoose/ai-act-explorer-nl/mcp/dist/mcp/src/http.js'`.

**nvm caveat**: `ExecStart` hardcodes the node path
(`~/.nvm/versions/node/v24.14.0/bin/node`). After a node upgrade, update the
unit and `systemctl --user daemon-reload && systemctl --user restart dora-mcp`.

## Reloading data

The corpus is read **once at startup**. After `npm run parse` or the
`update-source` skill:

```sh
systemctl --user restart dora-mcp     # remote server
# stdio servers pick up new data on next launch (Claude Desktop restart)
```
