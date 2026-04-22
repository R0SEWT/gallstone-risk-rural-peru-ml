"""Architecture and deployment diagrams for the gallstone demo.

Usage:
    pip install diagrams
    # Also install Graphviz: https://graphviz.org/download/
    python scripts/architecture_mingrammer.py

This script generates two PNG files in the current working directory:
    - gallstone_logical_architecture.png
    - gallstone_deployment_architecture.png

Notes:
    - The frontend deployment is clearly Vercel-backed in the repo.
    - The backend deployment is Dockerized and the repo includes a deploy
      script for Hugging Face Spaces; the Postman collection still mentions
      Railway as a production target. The deployment diagram keeps that
      ambiguity explicit instead of pretending there is a single confirmed host.
"""

from diagrams import Diagram
from diagrams.c4 import Container, Person, Relationship, System, SystemBoundary


GRAPH_ATTR = {
    "splines": "spline",
    "pad": "0.5",
    "nodesep": "0.7",
    "ranksep": "1.0",
}


def build_logical_architecture() -> None:
    with Diagram(
        "gallstone_logical_architecture",
        show=False,
        direction="LR",
        graph_attr=GRAPH_ATTR,
    ):
        user = Person(
            "Paciente / brigadista",
            description="Usuario que recorre la demo de tamizaje rural",
        )
        deepseek = System(
            "DeepSeek API",
            description="LLM externo usado por la entrevista guiada",
            external=True,
        )

        with SystemBoundary("Frontend publico"):
            web = Container(
                "Demo web",
                technology="Next.js 16 + React 19",
                description="Landing + /consulta + /medicion + /resultado",
            )
            state = Container(
                "Estado de sesion",
                technology="Zustand + sessionStorage",
                description="Guarda demographics, bioimpedance y prediction",
            )
            chat = Container(
                "Entrevista guiada",
                technology="Route Handler /api/chat",
                description="Runtime Node.js con AI SDK y streaming de texto",
            )

        with SystemBoundary("Backend ML"):
            api = Container(
                "Inference API",
                technology="FastAPI + Uvicorn",
                description="health, model/info, predict, explain y generate",
            )
            artifacts = Container(
                "Artifacts del modelo",
                technology="joblib + json",
                description="Pipeline, templates de bioimpedancia y metricas",
            )
            model = Container(
                "Motor de riesgo",
                technology="StandardScaler + GradientBoostingClassifier",
                description="Prediccion rural sobre 25 features",
            )
            explainability = Container(
                "Explicabilidad",
                technology="SHAP TreeExplainer",
                description="Contribucion por feature para la lectura final",
            )

        user >> Relationship("usa la demo") >> web
        web >> Relationship("persiste estado de la sesion") >> state
        web >> Relationship("invoca") >> chat
        chat >> Relationship("streamText con DEEPSEEK_API_KEY") >> deepseek
        web >> Relationship("REST via NEXT_PUBLIC_API_URL") >> api
        api >> Relationship("carga al iniciar") >> artifacts
        api >> Relationship("predice") >> model
        api >> Relationship("explica") >> explainability
        artifacts >> Relationship("provee pipeline y metricas") >> model
        artifacts >> Relationship("provee booster base") >> explainability


def build_deployment_architecture() -> None:
    with Diagram(
        "gallstone_deployment_architecture",
        show=False,
        direction="LR",
        graph_attr=GRAPH_ATTR,
    ):
        user = Person(
            "Usuario web",
            description="Acceso publico al demo desde navegador",
        )
        repo = System(
            "GitHub repo",
            description="rosewt-upc/WinterProject",
            external=True,
        )
        deepseek = System(
            "DeepSeek API",
            description="Proveedor externo del chat",
            external=True,
        )
        note = System(
            "Nota de despliegue",
            description="HF Space es el camino canonico en el repo; Postman aun menciona Railway",
            external=True,
        )
        domain = System(
            "gallstone.rosewt.dev",
            description="Dominio publico del frontend",
        )

        with SystemBoundary("Vercel"):
            frontend = Container(
                "Frontend Next.js",
                technology="Next.js 16 + /api/chat",
                description="UI publica; requiere NEXT_PUBLIC_API_URL y DEEPSEEK_API_KEY",
            )

        with SystemBoundary("Host Docker del backend"):
            backend = Container(
                "Backend FastAPI",
                technology="Python 3.12 + Uvicorn",
                description="Contenedor expuesto en puerto 8000",
            )
            bundled_models = Container(
                "Artifacts embebidos",
                technology="models/*",
                description="rural_gb_pipeline.joblib, templates y metricas",
            )

        deploy_script = Container(
            "HF deploy script",
            technology="bash + huggingface-cli",
            description="scripts/deploy_hf_space.sh sincroniza demo/backend",
        )

        user >> Relationship("HTTPS") >> domain
        domain >> Relationship("sirve la app") >> frontend
        frontend >> Relationship("chat server-side") >> deepseek
        frontend >> Relationship("REST: generate, predict, explain") >> backend
        backend >> Relationship("lee al arrancar") >> bundled_models
        repo >> Relationship("build/deploy") >> frontend
        repo >> Relationship("source of truth") >> deploy_script
        deploy_script >> Relationship("upload de demo/backend") >> backend
        note >> Relationship("aclara el host real del contenedor") >> backend


if __name__ == "__main__":
    build_logical_architecture()
    build_deployment_architecture()
