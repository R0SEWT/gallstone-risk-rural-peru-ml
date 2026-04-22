"""Render architecture diagrams for the gallstone demo.

Usage:
    python scripts/architecture_mingrammer.py

Outputs:
    demo/frontend/public/architecture/gallstone_runtime_architecture.png
    demo/frontend/public/architecture/gallstone_runtime_architecture.svg
    demo/frontend/public/architecture/gallstone_delivery_architecture.png
    demo/frontend/public/architecture/gallstone_delivery_architecture.svg

The runtime diagram focuses on user-facing flow.
The delivery diagram focuses on build, artifact export, and deploy flow.
"""

from __future__ import annotations

from pathlib import Path

from diagrams import Cluster, Diagram, Edge
from diagrams.custom import Custom
from diagrams.onprem.client import Users
from diagrams.onprem.vcs import Github
from diagrams.programming.framework import FastAPI, Nextjs
from diagrams.programming.language import Bash, NodeJS, Python


ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "scripts" / "assets" / "architecture_icons"
OUTPUT_DIR = ROOT / "demo" / "frontend" / "public" / "architecture"

GRAPH_ATTR = {
    "bgcolor": "#fcfbf7",
    "fontname": "Helvetica",
    "fontsize": "18",
    "labelloc": "t",
    "labeljust": "l",
    "nodesep": "0.8",
    "pad": "0.45",
    "ranksep": "1.0",
    "splines": "ortho",
}

NODE_ATTR = {
    "fontname": "Helvetica",
    "fontsize": "12",
}

EDGE_ATTR = {
    "fontname": "Helvetica",
    "fontsize": "10",
    "color": "#475569",
}


def icon(name: str) -> str:
    return str(ICONS_DIR / name)


def primary(label: str) -> Edge:
    return Edge(
        label=label,
        color="#0f172a",
        fontcolor="#0f172a",
        penwidth="2.0",
    )


def support(label: str) -> Edge:
    return Edge(
        label=label,
        color="#64748b",
        fontcolor="#475569",
        style="dashed",
    )


def build_runtime_architecture() -> None:
    with Diagram(
        name="Gallstone Demo · Runtime View",
        filename=str(OUTPUT_DIR / "gallstone_runtime_architecture"),
        show=False,
        direction="LR",
        outformat=["png", "svg"],
        graph_attr=GRAPH_ATTR,
        node_attr=NODE_ATTR,
        edge_attr=EDGE_ATTR,
    ):
        user = Users("Usuario web\npaciente / brigadista")
        domain = Custom(
            "gallstone.rosewt.dev\nsubdominio público",
            icon("domain_badge.png"),
        )
        deepseek = Custom(
            "DeepSeek API\nentrevista guiada",
            icon("deepseek_badge.png"),
        )

        with Cluster(
            "Vercel · Frontend público",
            graph_attr={
                "bgcolor": "#ffffff",
                "fontcolor": "#111827",
                "pencolor": "#cbd5e1",
            },
        ):
            vercel = Custom("Vercel\nhosting", icon("vercel_badge.png"))
            web = Nextjs("Next.js UI\nReact 19 + rutas")
            chat = NodeJS("/api/chat\nAI SDK")

        with Cluster(
            "Hugging Face Space · Backend ML",
            graph_attr={
                "bgcolor": "#fffdf4",
                "fontcolor": "#111827",
                "pencolor": "#f6c945",
            },
        ):
            hf = Custom(
                "HF Space\nDocker runtime",
                icon("huggingface_badge.png"),
            )
            api = FastAPI("FastAPI\npredict · explain · generate")
            predictor = Python("Modelo rural\nGB + SHAP")
            artifacts = Custom(
                "Artifacts\njoblib + json",
                icon("artifacts_badge.png"),
            )

        user >> primary("HTTPS") >> domain
        domain >> primary("sirve") >> vercel
        vercel >> primary("hostea") >> web
        web >> primary("chat server-side") >> chat
        chat >> primary("streamText") >> deepseek
        web >> primary("NEXT_PUBLIC_API_URL") >> hf
        hf >> primary("ejecuta") >> api
        api >> primary("predict / explain") >> predictor
        api >> support("load_artifacts()") >> artifacts


def build_delivery_architecture() -> None:
    with Diagram(
        name="Gallstone Demo · Delivery View",
        filename=str(OUTPUT_DIR / "gallstone_delivery_architecture"),
        show=False,
        direction="LR",
        outformat=["png", "svg"],
        graph_attr=GRAPH_ATTR,
        node_attr=NODE_ATTR,
        edge_attr=EDGE_ATTR,
    ):
        repo = Github("GitHub repo\nsource of truth")
        domain = Custom(
            "gallstone.rosewt.dev\nfrontend público",
            icon("domain_badge.png"),
        )

        with Cluster(
            "Frontend delivery",
            graph_attr={
                "bgcolor": "#ffffff",
                "fontcolor": "#111827",
                "pencolor": "#cbd5e1",
            },
        ):
            vercel = Custom("Vercel project\nbuild + previews", icon("vercel_badge.png"))
            frontend = Nextjs("demo/frontend\nNext.js 16")

        with Cluster(
            "Backend delivery",
            graph_attr={
                "bgcolor": "#fffdf4",
                "fontcolor": "#111827",
                "pencolor": "#f6c945",
            },
        ):
            export_model = Python("scripts/export_model.py\nexporta pipeline")
            artifacts = Custom(
                "demo/backend/models\njoblib + json",
                icon("artifacts_badge.png"),
            )
            deploy = Bash("scripts/deploy_hf_space.sh\nhf upload")
            hf = Custom("HF Space\nAPI pública", icon("huggingface_badge.png"))

        repo >> primary("build frontend") >> vercel
        vercel >> primary("despliega") >> frontend
        frontend >> primary("sirve") >> domain

        repo >> support("código backend") >> export_model
        export_model >> primary("genera") >> artifacts
        repo >> support("source of truth") >> deploy
        artifacts >> primary("se empaqueta") >> deploy
        deploy >> primary("publica backend") >> hf
        frontend >> support("consume API por URL pública") >> hf


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_runtime_architecture()
    build_delivery_architecture()
