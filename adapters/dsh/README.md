# Riko Memory for DSH Minimal

This directory is both the DSH adapter package and an installable DSH bundle. Its bundle patch overrides only the shipped `preset-minimal` declaration and preserves that preset's existing persona and terminal entries.

## Install

Install this package from the public Riko-Memory repository into the DSH profile that contains the Minimal agent preset:

```text
github:AkinoHaruka/Riko-Memory#path:/adapters/dsh
```

In Creator mode, use `plugin_manager` with `action: install_bundle` and the specifier above as `target`. The DSH plugin page or `dsh plugin --profile <profile> add <specifier>` can also install the bundle. Installation adds the bundle to that profile; the bundle patch changes only the Minimal agent preset. Other agent presets are untouched.

## Configure the local connection

The adapter remains disabled until all three environment variables below are present. Set them in the DSH process environment (or the DSH home `.env` file):

| Variable | Value |
|---|---|
| `AGENT_MEMORY_TOKEN_FILE` | Absolute path to the token file created by `memoryd principal add` |
| `AGENT_MEMORY_SPOOL_DIR` | Absolute path for this DSH installation's durable event spool |
| `AGENT_MEMORY_HOST_ID` | Stable, non-secret identifier for this DSH installation |

The default memory service address is `http://127.0.0.1:8791`. If the service uses another loopback port, edit the `agent-memory` row's `memoryUrl` in the profile `cordis.patch.yml`. The adapter requests D6 context-bundle injection and uses the stable Agent identity `minimal` for Soul lookup. The database must advertise `context_bundle_v1`; if the capability handshake is unavailable, the plugin keeps capture/tools available but disables automatic v6 injection and reports the issue.

The token file must remain outside Git and outside the plugin package. Do not put token contents in the profile patch or environment variable; only the token file path is configured.

## Package contents

`minimal-memory.patch.yml` replaces the complete `preset-minimal` config because DSH's patch contract does not deep-merge `config`. It copies the current upstream Minimal composition and appends the adapter row. The adapter module is loaded from `./dist/index.js` relative to the patch file. `dist/` is included so Git-subdirectory installation does not need to compile TypeScript or access this repository's local DSH checkout.

The package was prepared against the checked-out DSH source at `21638c56315ae6a2b552d6091945d3144c9af32e`. DSH's package manager performs peer-version compatibility checks at install/composition time.
