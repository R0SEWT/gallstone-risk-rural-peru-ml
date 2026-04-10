from __future__ import annotations

from pathlib import Path

import nbformat
from nbclient import NotebookClient

from portfolio_pipeline import save_metrics_comparison_figure


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOKS_DIR = ROOT / "notebooks"
FIGURES_DIR = ROOT / "figures"


def build_replication_notebook() -> nbformat.NotebookNode:
    notebook = nbformat.v4.new_notebook()
    notebook.cells = [
        nbformat.v4.new_markdown_cell(
            """# Réplica del paper con variables completas

Este notebook replica el flujo central del paper usando las variables completas del dataset UCI:

- división estratificada 70/30,
- escalado con `StandardScaler`,
- selección de 32 variables con ANOVA F-score,
- benchmark de cinco modelos,
- replay determinista del mejor experimento `SMOTE + Optuna` sobre `Gradient Boosting`.

El objetivo de esta pieza no es proponer un uso clínico directo, sino mostrar capacidad de reproducción metodológica y comparación experimental."""
        ),
        nbformat.v4.new_code_cell(
            """from pathlib import Path
import sys

ROOT = Path.cwd().resolve().parents[0]
sys.path.insert(0, str(ROOT / "scripts"))

from portfolio_pipeline import run_full_experiment

DATA_PATH = ROOT / "data" / "dataset-uci.xlsx"
REPORT_PATH = ROOT / "figures" / "replica_metrics.json"

results = run_full_experiment(DATA_PATH, report_path=REPORT_PATH)"""
        ),
        nbformat.v4.new_code_cell(
            """print("Variables seleccionadas por ANOVA:")
for feature in results["selected_features"]:
    print("-", feature)"""
        ),
    ]
    return notebook


def build_rural_notebook() -> nbformat.NotebookNode:
    notebook = nbformat.v4.new_notebook()
    notebook.cells = [
        nbformat.v4.new_markdown_cell(
            """# Adaptación rural para Perú sin pruebas de laboratorio

Este notebook conserva solo variables que podrían levantarse en una visita de campo:

- demografía e historial clínico,
- medidas antropométricas,
- bioimpedancia portátil.

Se excluyen pruebas de laboratorio para convertir el problema en uno de tamizaje y priorización de riesgo en contextos con acceso limitado a análisis clínicos."""
        ),
        nbformat.v4.new_code_cell(
            """from pathlib import Path
import sys

ROOT = Path.cwd().resolve().parents[0]
sys.path.insert(0, str(ROOT / "scripts"))

from portfolio_pipeline import LAB_EXCLUDED_FEATURES, run_rural_experiment

DATA_PATH = ROOT / "data" / "dataset-uci.xlsx"
FIGURES_DIR = ROOT / "figures"
REPORT_PATH = FIGURES_DIR / "rural_metrics.json"

results = run_rural_experiment(
    DATA_PATH,
    figures_dir=FIGURES_DIR,
    report_path=REPORT_PATH,
)"""
        ),
        nbformat.v4.new_code_cell(
            """print("Variables excluidas por requerir laboratorio:")
for feature in LAB_EXCLUDED_FEATURES:
    print("-", feature)"""
        ),
    ]
    return notebook


def execute_notebook(notebook_path: Path) -> None:
    with notebook_path.open() as handle:
        notebook = nbformat.read(handle, as_version=4)

    client = NotebookClient(
        notebook,
        timeout=3600,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebook_path.parent)}},
    )
    executed = client.execute()

    with notebook_path.open("w") as handle:
        nbformat.write(executed, handle)


def write_notebook(notebook_path: Path, notebook: nbformat.NotebookNode) -> None:
    notebook_path.parent.mkdir(parents=True, exist_ok=True)
    with notebook_path.open("w") as handle:
        nbformat.write(notebook, handle)


def main() -> None:
    NOTEBOOKS_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    replication_path = NOTEBOOKS_DIR / "01_replicacion_paper.ipynb"
    rural_path = NOTEBOOKS_DIR / "02_adaptacion_rural_peru.ipynb"

    write_notebook(replication_path, build_replication_notebook())
    write_notebook(rural_path, build_rural_notebook())

    execute_notebook(replication_path)
    execute_notebook(rural_path)

    save_metrics_comparison_figure(
        FIGURES_DIR / "replica_metrics.json",
        FIGURES_DIR / "rural_metrics.json",
        FIGURES_DIR / "metrics_comparison.png",
    )


if __name__ == "__main__":
    main()
