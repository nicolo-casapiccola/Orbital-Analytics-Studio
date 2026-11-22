import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path

# ============================================================
# CONFIGURAZIONE PAGINA
# ============================================================
st.set_page_config(
    page_title="Space Debris Dashboard",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ============================================================
# CSS RESPONSIVE CUSTOM
# ============================================================
st.markdown("""
<style>
    /* Layout più compatto su mobile */
    @media (max-width: 768px) {
        .block-container { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        h1 { font-size: 1.4rem !important; }
        h2 { font-size: 1.1rem !important; }
    }
    /* Card KPI */
    div[data-testid="stMetric"] {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 1px solid #374151;
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    div[data-testid="stMetricLabel"] { color: #9ca3af !important; }
    div[data-testid="stMetricValue"] { color: #60a5fa !important; }
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 4px; }
    .stTabs [data-baseweb="tab"] {
        padding: 6px 12px;
        border-radius: 8px 8px 0 0;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================
# CARICAMENTO DATI (cached)
# ============================================================
CSV_PATH = Path("satcat.csv")  # <-- nome del tuo file CSV

@st.cache_data(show_spinner="Caricamento dati in corso...")
def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # Conversione tipi
    if "launch_date" in df.columns:
        df["launch_date"] = pd.to_datetime(df["launch_date"], errors="coerce")
    for col in ["launch_year", "perigee_km", "apogee_km", "inclination_deg"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    # Pulizia stringhe
    for col in ["object_type", "state", "owner", "status", "orbit_class"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().replace({"nan": None})
    return df


def get_data() -> pd.DataFrame:
    if not CSV_PATH.exists():
        st.error(f"⚠️ File `{CSV_PATH}` non trovato. Mettilo nella stessa cartella di `app.py`.")
        st.stop()
    return load_data(str(CSV_PATH))


df_raw = get_data()

# ============================================================
# SIDEBAR - FILTRI
# ============================================================
st.sidebar.header("🔎 Filtri")

def multiselect_filter(label: str, col: str):
    if col not in df_raw.columns:
        return []
    opts = sorted(df_raw[col].dropna().unique().tolist())
    return st.sidebar.multiselect(label, opts, default=[])

f_type   = multiselect_filter("Tipo di oggetto", "object_type")
f_state  = multiselect_filter("Stato / Nazione", "state")
f_owner  = multiselect_filter("Proprietario", "owner")
f_status = multiselect_filter("Status operativo", "status")
f_orbit  = multiselect_filter("Classe orbitale", "orbit_class")

# Range anno lancio
if "launch_year" in df_raw.columns and df_raw["launch_year"].notna().any():
    y_min = int(df_raw["launch_year"].min())
    y_max = int(df_raw["launch_year"].max())
    y_sel = st.sidebar.slider("Anno di lancio", y_min, y_max, (y_min, y_max))
else:
    y_sel = None

# Applica filtri
df = df_raw.copy()
for col, sel in [
    ("object_type", f_type),
    ("state", f_state),
    ("owner", f_owner),
    ("status", f_status),
    ("orbit_class", f_orbit),
]:
    if sel and col in df.columns:
        df = df[df[col].isin(sel)]

if y_sel and "launch_year" in df.columns:
    df = df[(df["launch_year"] >= y_sel[0]) & (df["launch_year"] <= y_sel[1])]

# ============================================================
# HEADER
# ============================================================
st.title("🛰️ Space Debris Dashboard")
st.caption(f"Oggetti visualizzati: **{len(df):,}** su **{len(df_raw):,}** totali")

if df.empty:
    st.warning("Nessun dato corrisponde ai filtri selezionati.")
    st.stop()

# ============================================================
# KPI CARDS
# ============================================================
c1, c2, c3, c4 = st.columns(4)

total = len(df)
payloads = (df["object_type"].str.lower().str.contains("payload", na=False)).sum() if "object_type" in df else 0
debris_n = (df["object_type"].str.lower().str.contains("debris|fragment", na=False, regex=True)).sum() if "object_type" in df else 0
n_owner = df["owner"].nunique() if "owner" in df else 0

with c1:
    st.metric("Totale oggetti", f"{total:,}")
with c2:
    st.metric("Payload", f"{payloads:,}")
with c3:
    st.metric("Detriti", f"{debris_n:,}")
with c4:
    st.metric("Proprietari distinti", f"{n_owner:,}")

st.divider()

# ============================================================
# TABS
# ============================================================
tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["📈 Trend temporale", "🌍 Per Stato/Owner", "🛰️ Tipologia", "🛰️ Orbite", "📋 Dati"]
)

# --- TAB 1: Trend temporale ---
with tab1:
    if "launch_year" in df.columns and df["launch_year"].notna().any():
        trend = (
            df.dropna(subset=["launch_year"])
              .groupby(["launch_year", "object_type"], dropna=False)
              .size()
              .reset_index(name="count")
        )
        fig = px.bar(
            trend, x="launch_year", y="count", color="object_type",
            title="Lanci per anno per tipologia",
            labels={"launch_year": "Anno", "count": "N° oggetti", "object_type": "Tipo"},
        )
        fig.update_layout(
            template="plotly_dark", height=520,
            legend=dict(orientation="h", y=-0.2),
            margin=dict(l=10, r=10, t=50, b=10),
        )
        st.plotly_chart(fig, use_container_width=True)

        # Cumulativo
        cum = (
            df.dropna(subset=["launch_year"])
              .groupby("launch_year").size().cumsum().reset_index(name="cum")
        )
        fig2 = px.area(
            cum, x="launch_year", y="cum",
            title="Oggetti cumulativi nel tempo",
            labels={"launch_year": "Anno", "cum": "Totale cumulativo"},
        )
        fig2.update_layout(template="plotly_dark", height=380,
                           margin=dict(l=10, r=10, t=50, b=10))
        st.plotly_chart(fig2, use_container_width=True)
    else:
        st.info("Colonna `launch_year` non disponibile.")

# --- TAB 2: Per Stato/Owner ---
with tab2:
    def top_bar(col: str, title: str, top_n: int = 20):
        if col not in df.columns:
            st.info(f"Colonna `{col}` non disponibile.")
            return
        s = df[col].dropna().value_counts().head(top_n).reset_index()
        s.columns = [col, "count"]
        fig = px.bar(
            s.sort_values("count"), x="count", y=col, orientation="h",
            title=title, labels={"count": "N° oggetti", col: ""},
            color="count", color_continuous_scale="Blues",
        )
        fig.update_layout(template="plotly_dark", height=560,
                          margin=dict(l=10, r=10, t=50, b=10),
                          coloraxis_showscale=False, yaxis=dict(automargin=True))
        st.plotly_chart(fig, use_container_width=True)

    col_a, col_b = st.columns(2)
    with col_a:
        top_bar("state", "Top 20 stati")
    with col_b:
        top_bar("owner", "Top 20 proprietari")

    if "state" in df.columns:
        pie_data = df["state"].dropna().value_counts().head(15).reset_index()
        pie_data.columns = ["state", "count"]
        fig = px.pie(pie_data, names="state", values="count",
                     title="Distribuzione per Stato (top 15)",
                     hole=0.45)
        fig.update_layout(template="plotly_dark", height=520,
                          margin=dict(l=10, r=10, t=50, b=10))
        st.plotly_chart(fig, use_container_width=True)

# --- TAB 3: Tipologia ---
with tab3:
    col_a, col_b = st.columns(2)

    with col_a:
        if "object_type" in df.columns:
            d = df["object_type"].dropna().value_counts().reset_index()
            d.columns = ["object_type", "count"]
            fig = px.pie(d, names="object_type", values="count",
                         title="Distribuzione per tipo di oggetto", hole=0.5)
            fig.update_layout(template="plotly_dark", height=460,
                              margin=dict(l=10, r=10, t=50, b=10))
            st.plotly_chart(fig, use_container_width=True)

    with col_b:
        if "status" in df.columns:
            d = df["status"].dropna().value_counts().reset_index()
            d.columns = ["status", "count"]
            fig = px.bar(d, x="status", y="count",
                         title="Distribuzione per status",
                         color="count", color_continuous_scale="Viridis")
            fig.update_layout(template="plotly_dark", height=460,
                              margin=dict(l=10, r=10, t=50, b=10),
                              coloraxis_showscale=False, xaxis_tickangle=-30)
            st.plotly_chart(fig, use_container_width=True)

    # Sankey stato -> tipo (opzionale e carino)
    if {"state", "object_type"}.issubset(df.columns):
        sub = df.dropna(subset=["state", "object_type"])
        if not sub.empty:
            top_states = sub["state"].value_counts().head(10).index
            sub = sub[sub["state"].isin(top_states)]
            links = sub.groupby(["state", "object_type"]).size().reset_index(name="count")
            states = links["state"].unique().tolist()
            types = links["object_type"].unique().tolist()
            labels = states + types
            idx = {l: i for i, l in enumerate(labels)}
            source = links["state"].map(idx)
            target = links["object_type"].map(idx)
            sankey = go.Figure(go.Sankey(
                node=dict(label=labels, pad=15, thickness=18),
                link=dict(source=source, target=target, value=links["count"]),
            ))
            sankey.update_layout(title="Flusso Stato → Tipo di oggetto",
                                 template="plotly_dark", height=520,
                                 margin=dict(l=10, r=10, t=50, b=10))
            st.plotly_chart(sankey, use_container_width=True)

# --- TAB 4: Orbite ---
with tab4:
    col_a, col_b = st.columns(2)

    with col_a:
        if "orbit_class" in df.columns:
            d = df["orbit_class"].dropna().value_counts().reset_index()
            d.columns = ["orbit_class", "count"]
            fig = px.bar(d, x="orbit_class", y="count",
                         title="Oggetti per classe orbitale",
                         color="count", color_continuous_scale="Plasma")
            fig.update_layout(template="plotly_dark", height=460,
                              margin=dict(l=10, r=10, t=50, b=10),
                              coloraxis_showscale=False, xaxis_tickangle=-30)
            st.plotly_chart(fig, use_container_width=True)

    with col_b:
        if {"inclination_deg", "orbit_class"}.issubset(df.columns):
            sub = df.dropna(subset=["inclination_deg", "orbit_class"])
            if not sub.empty:
                fig = px.histogram(sub, x="inclination_deg", color="orbit_class",
                                   nbins=40, title="Distribuzione inclinazione",
                                   barmode="overlay")
                fig.update_layout(template="plotly_dark", height=460,
                                  margin=dict(l=10, r=10, t=50, b=10),
                                  xaxis_title="Inclinazione (°)", yaxis_title="N°")
                st.plotly_chart(fig, use_container_width=True)

    # Scatter apogeo vs perigeo
    if {"perigee_km", "apogee_km", "object_type"}.issubset(df.columns):
        sub = df.dropna(subset=["perigee_km", "apogee_km", "object_type"])
        if not sub.empty:
            sample = sub if len(sub) < 8000 else sub.sample(8000, random_state=42)
            fig = px.scatter(
                sample, x="perigee_km", y="apogee_km", color="object_type",
                hover_data=["name"] if "name" in sample.columns else None,
                title="Altitudine: perigeo vs apogeo",
                opacity=0.65, log_x=True, log_y=True,
            )
            fig.update_layout(template="plotly_dark", height=560,
                              margin=dict(l=10, r=10, t=50, b=10))
            st.plotly_chart(fig, use_container_width=True)

# --- TAB 5: Dati ---
with tab5:
    st.subheader("Tabella dati filtrati")
    cols_show = [c for c in df.columns if c in [
        "name", "jcat", "satcat", "launch_date", "launch_year",
        "object_type", "state", "owner", "status", "orbit_class",
        "perigee_km", "apogee_km", "inclination_deg",
    ]]
    st.dataframe(
        df[cols_show].reset_index(drop=True),
        use_container_width=True,
        height=520,
    )

    csv = df[cols_show].to_csv(index=False).encode("utf-8")
    st.download_button(
        "⬇️ Scarica CSV filtrato",
        data=csv, file_name="debris_filtered.csv", mime="text/csv",
    )

# ============================================================
# FOOTER
# ============================================================
st.divider()
st.caption("Space Debris Dashboard · dati aggregati · sviluppato con Streamlit + Plotly")