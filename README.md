# Orbital Analytics Studio

Una presentazione interattiva, minimale, dei satelliti in orbita e della storia spaziale. L'app risponde alle domande chiave dell'astronautica:

1. **Panoramica** — quanto è cresciuta la flotta e quando sono partiti i lanci.
2. **Operatori** — chi controlla i satelliti e quanto è concentrato il settore.
3. **Scopi** — a cosa servono i satelliti e come cambia lo scopo in base all'orbita.
4. **Catalogo SATCAT** — 70 anni di storia orbitale (1957–2026), i 3 grandi picchi di lanci e il problema dei detriti.
5. **Italia** — la storia dell'Italia nello spazio dal San Marco 1 (1964) ai radar COSMO-SkyMed e ai vettori logistici ION di D-Orbit, basata sul Registro ASI.

La sezione **Dati** permette di cercare, ordinare ed esportare i satelliti della selezione.

## Dati

L'app usa tre dataset reali nella cartella `datasets/`:

| File | Contenuto |
|---|---|
| `ucs_satellites.csv` | Censimento UCS dei satelliti: operatore, paese, scopo, utenza, massa. Snapshot 27 aprile 2023. |
| `satcat.csv` | Catalogo SATCAT di tutti gli oggetti tracciati dal 1957 al 2026: payload, detriti, stadi, componenti. |
| `asi.csv` | Registro Nazionale degli Oggetti Spaziali dell'Agenzia Spaziale Italiana (ASI): missioni, operatori e basi dal 1964. |

I dataset vengono elaborati da `scripts/prepare-data.mjs` che genera `src/data/dataset.json`. In questo modo l'app parte all'istante senza dover parsare nel browser i file CSV di grandi dimensioni.

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

## Note sui dati e sui picchi storici

- **Catalogo SATCAT e i 3 Grandi Picchi**:
  - **Guerra Fredda (1982–1984)**: record di 233 satelliti nel 1983 e 2.748 oggetti complessivi nel 1982 durante le massime tensioni USA–URSS.
  - **Caduta Unione Sovietica (1988–1990)**: ultimo sprint sovietico (218 satelliti nel 1990 con la stazione Mir e i satelliti Cosmos) prima del crollo dell'URSS a fine 1991.
  - **Record New Space 2025**: record storico assoluto di 4.503 satelliti immessi in orbita in un solo anno grazie alle megacostellazioni commerciali (Starlink, Kuiper).
- **Sezione Italia**:
  - Basata su `datasets/asi.csv` e incrociata con il SATCAT (133 oggetti a bandiera italiana nel catalogo globale). Include la timeline dal 1964 (San Marco 1), la ripartizione per missione e tipologia di operatore e la tabella interattiva del registro.
