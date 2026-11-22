# Orbital Analytics Studio

Una presentazione interattiva, minimale, dei satelliti in orbita. L'app risponde a quattro
domande:

1. **Panoramica** — quanto è cresciuta la flotta e quando sono partiti i lanci.
2. **Operatori** — chi controlla i satelliti e quanto è concentrato il settore.
3. **Scopi** — a cosa servono i satelliti e come cambia lo scopo in base all'orbita.
4. **Detriti** — quanti oggetti restano in orbita e quanto pesa il problema della sostenibilità.

La sezione **Dati** permette di cercare, ordinare ed esportare i satelliti della selezione.

## Dati

L'app usa due file reali nella cartella `datasets/`:

| File | Contenuto |
|---|---|
| `ucs_satellites.csv` | Censimento UCS dei satelliti: operatore, paese, scopo, utenza, massa. Snapshot 27 aprile 2023. |
| `satcat.csv` | Catalogo SATCAT di tutti gli oggetti tracciati: payload, detriti, stadi, componenti. |

I due dataset vengono incrociati su `ucs.norad_id = satcat.satcat`. Dopo la deduplica il
dataset contiene **7.439 satelliti**, di cui **5.483 in orbita**.

Lo script `scripts/prepare-data.mjs` legge i CSV e genera `src/data/dataset.json`, che viene
committato. In questo modo l'app parte subito, senza parsare 8,6 MB di CSV nel browser.

```bash
npm run data     # rigenera src/data/dataset.json dai CSV
```

`npm run dev` e `npm run build` eseguono lo script automaticamente (`predev` / `prebuild`).

## Avvio

```bash
npm install
npm run dev
```

Apri http://localhost:3000.

## Build

```bash
npm run lint
npm run build
```

## Note sui dati

- Il censimento UCS si ferma al **27 aprile 2023**: il 2023 è parziale, quindi il grafico dei
  lanci copre **1974–2022**.
- Il catalogo SATCAT include detriti, stadi e componenti, non solo satelliti. La sezione
  **Detriti** usa il catalogo completo e non viene filtrata.
- Nel SATCAT l'anno di lancio di un detrito è quello dell'oggetto padre: per questo non
  mostriamo un grafico "detriti creati per anno".
