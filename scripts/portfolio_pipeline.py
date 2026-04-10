from __future__ import annotations

import json
import random
import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap
from catboost import CatBoostClassifier
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier


SEED = 42
DATA_SHEET = "dataset"
TARGET_COLUMN = "GallstoneStatus"
RECORDED_OPTUNA_PARAMS = {
    "replica completa": {
        "n_estimators": 894,
        "learning_rate": 0.2975045700161574,
        "max_depth": 4,
        "min_samples_leaf": 19,
        "subsample": 0.7139837324629363,
    },
    "rural": {
        "n_estimators": 692,
        "learning_rate": 0.030187783433557297,
        "max_depth": 8,
        "min_samples_leaf": 16,
        "subsample": 0.6342139062637353,
    },
}

RURAL_FEATURES = [
    "Age",
    "Gender",
    "Comorbidity",
    "CAD",
    "Hypothyroidism",
    "Hyperlipidemia",
    "DM",
    "Height",
    "Weight",
    "BMI",
    "TBW",
    "ECW",
    "ICW",
    "ECF_TBW",
    "TBFR",
    "LM",
    "Protein",
    "VFR",
    "BM",
    "MM",
    "Obesity",
    "TFC",
    "VFA",
    "VMA",
    "HFA",
]

LAB_EXCLUDED_FEATURES = [
    "Glucose",
    "TC",
    "LDL",
    "HDL",
    "Triglyceride",
    "AST",
    "ALT",
    "ALP",
    "Creatinine",
    "GFR",
    "CRP",
    "HGB",
    "VitaminD",
]


def set_global_seed(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)


def configure_style() -> None:
    sns.set_theme(style="whitegrid", context="talk")
    plt.rcParams["figure.figsize"] = (10, 6)
    plt.rcParams["axes.titlesize"] = 16
    plt.rcParams["axes.labelsize"] = 12
    plt.rcParams["savefig.bbox"] = "tight"


def _display_frame(frame: pd.DataFrame) -> None:
    try:
        from IPython.display import display

        display(frame)
    except ImportError:
        print(frame.to_string(index=False))


def _save_json_report(result: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "scenario": result["scenario"],
        "dataset_shape": result["dataset_shape"],
        "feature_count": result["feature_count"],
        "best_benchmark_name": result["best_benchmark_name"],
        "best_benchmark_accuracy": result["best_benchmark_accuracy"],
        "best_benchmark_auc": result["best_benchmark_auc"],
        "optimized_model_name": result["optimized_model_name"],
        "optimized_accuracy": result["optimized_accuracy"],
        "optimized_auc": result["optimized_auc"],
        "selected_features": result["selected_features"],
        "excluded_features": result["excluded_features"],
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))


def _create_metrics_comparison_frame(full_report: dict, rural_report: dict) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Escenario": "Réplica completa",
                "Estrategia": f"Mejor benchmark ({full_report['best_benchmark_name']})",
                "Accuracy": full_report["best_benchmark_accuracy"],
                "AUC": full_report["best_benchmark_auc"],
            },
            {
                "Escenario": "Réplica completa",
                "Estrategia": full_report["optimized_model_name"],
                "Accuracy": full_report["optimized_accuracy"],
                "AUC": full_report["optimized_auc"],
            },
            {
                "Escenario": "Adaptación rural",
                "Estrategia": f"Mejor benchmark ({rural_report['best_benchmark_name']})",
                "Accuracy": rural_report["best_benchmark_accuracy"],
                "AUC": rural_report["best_benchmark_auc"],
            },
            {
                "Escenario": "Adaptación rural",
                "Estrategia": rural_report["optimized_model_name"],
                "Accuracy": rural_report["optimized_accuracy"],
                "AUC": rural_report["optimized_auc"],
            },
        ]
    )


def save_metrics_comparison_figure(
    full_report_path: Path,
    rural_report_path: Path,
    output_path: Path,
) -> pd.DataFrame:
    full_report = json.loads(full_report_path.read_text())
    rural_report = json.loads(rural_report_path.read_text())
    frame = _create_metrics_comparison_frame(full_report, rural_report)

    fig, ax = plt.subplots(figsize=(11, 3.4))
    ax.axis("off")
    formatted = frame.copy()
    formatted["Accuracy"] = formatted["Accuracy"].map(lambda value: f"{value:.4f}")
    formatted["AUC"] = formatted["AUC"].map(lambda value: f"{value:.4f}")

    table = ax.table(
        cellText=formatted.values,
        colLabels=formatted.columns,
        cellLoc="center",
        colLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.55)

    for row_index in range(len(formatted) + 1):
        for col_index in range(len(formatted.columns)):
            cell = table[row_index, col_index]
            if row_index == 0:
                cell.set_text_props(weight="bold", color="white")
                cell.set_facecolor("#0f4c5c")
            elif row_index in (1, 2):
                cell.set_facecolor("#edf6f9")
            else:
                cell.set_facecolor("#fff4e6")

    ax.set_title("Resumen comparativo de métricas", pad=18, fontweight="bold")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    return frame


def _load_dataset(data_path: Path) -> pd.DataFrame:
    data_path = Path(data_path)
    if not data_path.exists():
        raise FileNotFoundError(f"No se encontró el dataset en {data_path}")
    return pd.read_excel(data_path, sheet_name=DATA_SHEET)


def _benchmark_models(scenario: str) -> tuple[dict, dict]:
    models = {
        "Logistic Regression": LogisticRegression(random_state=SEED, max_iter=1000),
        "Random Forest": RandomForestClassifier(random_state=SEED, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(random_state=SEED),
        "XGBoost": XGBClassifier(
            eval_metric="logloss",
            use_label_encoder=False,
            random_state=SEED,
            n_estimators=200,
            n_jobs=-1,
            verbosity=0,
        ),
        "CatBoost": CatBoostClassifier(
            verbose=0,
            random_state=SEED,
            loss_function="Logloss",
            thread_count=-1,
        ),
    }

    if scenario == "rural":
        param_grids = {
            "Logistic Regression": {"C": [0.1, 1, 10]},
            "Random Forest": {"n_estimators": [100, 200], "max_depth": [5, 10]},
            "Gradient Boosting": {
                "n_estimators": [100, 200],
                "learning_rate": [0.05, 0.1],
            },
            "XGBoost": {
                "n_estimators": [100, 200],
                "learning_rate": [0.05, 0.1],
            },
            "CatBoost": {
                "iterations": [100, 200],
                "learning_rate": [0.05, 0.1],
            },
        }
    else:
        param_grids = {
            "Logistic Regression": {"C": [0.1, 1, 10]},
            "Random Forest": {"n_estimators": [100, 200], "max_depth": [8, 10]},
            "Gradient Boosting": {
                "n_estimators": [100, 300],
                "learning_rate": [0.05, 0.1],
                "max_depth": [3, 4],
            },
            "XGBoost": {
                "n_estimators": [100, 200],
                "learning_rate": [0.1],
                "max_depth": [3],
            },
            "CatBoost": {
                "iterations": [200, 300],
                "learning_rate": [0.05, 0.1],
                "depth": [4],
            },
        }
    return models, param_grids


def _prepare_feature_matrices(
    df: pd.DataFrame,
    feature_columns: list[str] | None = None,
    *,
    select_k: int | None = None,
) -> dict:
    X = df[feature_columns].copy() if feature_columns is not None else df.drop(columns=[TARGET_COLUMN]).copy()
    y = df[TARGET_COLUMN].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.30,
        random_state=SEED,
        stratify=y,
    )

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index,
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test),
        columns=X_test.columns,
        index=X_test.index,
    )

    selected_features = list(X.columns)
    X_train_model = X_train_scaled.copy()
    X_test_model = X_test_scaled.copy()

    if select_k is not None:
        selector = SelectKBest(score_func=f_classif, k=select_k)
        selector.fit(X_train_scaled, y_train)
        selected_features = list(X.columns[selector.get_support()])
        X_train_model = pd.DataFrame(
            selector.transform(X_train_scaled),
            columns=selected_features,
            index=X_train.index,
        )
        X_test_model = pd.DataFrame(
            selector.transform(X_test_scaled),
            columns=selected_features,
            index=X_test.index,
        )

    return {
        "X": X,
        "y": y,
        "X_train": X_train,
        "X_test": X_test,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "X_train_model": X_train_model,
        "X_test_model": X_test_model,
        "y_train": y_train,
        "y_test": y_test,
        "selected_features": selected_features,
    }


def _run_benchmark(
    scenario: str,
    X_train_model: pd.DataFrame,
    X_test_model: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> tuple[pd.DataFrame, dict]:
    models, param_grids = _benchmark_models(scenario)
    benchmark_rows = []
    best_models = {}

    for model_name, model in models.items():
        print(f"Evaluando {model_name}...")
        search = GridSearchCV(
            model,
            param_grids[model_name],
            cv=5,
            scoring="accuracy",
            n_jobs=-1,
        )
        search.fit(X_train_model, y_train)

        best_model = search.best_estimator_
        y_pred = best_model.predict(X_test_model)
        y_proba = best_model.predict_proba(X_test_model)[:, 1]

        best_models[model_name] = best_model
        benchmark_rows.append(
            {
                "Modelo": model_name,
                "Test Accuracy": accuracy_score(y_test, y_pred),
                "Test AUC": roc_auc_score(y_test, y_proba),
                "Mejores Parámetros": search.best_params_,
            }
        )

    benchmark_df = pd.DataFrame(benchmark_rows).sort_values(by="Test Accuracy", ascending=False).reset_index(drop=True)
    return benchmark_df, best_models


def _apply_smote(X_train_model: pd.DataFrame, y_train: pd.Series) -> tuple[pd.DataFrame, pd.Series]:
    smote = SMOTE(random_state=SEED)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_model, y_train)
    X_train_smote = pd.DataFrame(X_train_smote, columns=X_train_model.columns)
    y_train_smote = pd.Series(y_train_smote, name=TARGET_COLUMN)
    return X_train_smote, y_train_smote


def _render_confusion_matrix(cm: np.ndarray, output_path: Path | None, title: str) -> None:
    fig, ax = plt.subplots(figsize=(7.5, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Predicho sano", "Predicho con cálculos"],
        yticklabels=["Real sano", "Real con cálculos"],
        ax=ax,
    )
    ax.set_title(title)
    ax.set_xlabel("Predicción")
    ax.set_ylabel("Valor real")
    fig.tight_layout()

    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_path, dpi=200)
    plt.show()
    plt.close(fig)


def _render_shap_bar_plot(
    model: GradientBoostingClassifier,
    X_test_model: pd.DataFrame,
    output_path: Path | None,
    title: str,
) -> None:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test_model, check_additivity=False)

    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_test_model, plot_type="bar", show=False)
    plt.title(title)
    plt.tight_layout()

    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, dpi=200)
    plt.show()
    plt.close()


def _run_experiment(
    *,
    data_path: Path,
    scenario: str,
    notebook_title: str,
    feature_columns: list[str] | None,
    select_k: int | None,
    excluded_features: list[str],
    figures_dir: Path | None = None,
    report_path: Path | None = None,
) -> dict:
    warnings.filterwarnings("ignore")
    set_global_seed()
    configure_style()
    df = _load_dataset(data_path)
    prepared = _prepare_feature_matrices(df, feature_columns=feature_columns, select_k=select_k)

    print(notebook_title)
    print(f"Dataset cargado con dimensiones: {df.shape}")
    print(f"Conjunto de entrenamiento: {prepared['X_train_model'].shape}")
    print(f"Conjunto de prueba: {prepared['X_test_model'].shape}")
    print(f"Variables de entrada utilizadas: {len(prepared['selected_features'])}")
    if select_k is not None:
        print(f"Selección ANOVA aplicada: {select_k} variables")

    benchmark_df, _ = _run_benchmark(
        scenario,
        prepared["X_train_model"],
        prepared["X_test_model"],
        prepared["y_train"],
        prepared["y_test"],
    )
    print("\nResultados del benchmark:")
    _display_frame(benchmark_df)

    X_train_smote, y_train_smote = _apply_smote(
        prepared["X_train_model"],
        prepared["y_train"],
    )
    replayed_best_params = RECORDED_OPTUNA_PARAMS[scenario]
    final_model = GradientBoostingClassifier(random_state=SEED, **replayed_best_params)
    final_model.fit(X_train_smote, y_train_smote)

    y_pred = final_model.predict(prepared["X_test_model"])
    y_proba = final_model.predict_proba(prepared["X_test_model"])[:, 1]

    optimized_accuracy = accuracy_score(prepared["y_test"], y_pred)
    optimized_auc = roc_auc_score(prepared["y_test"], y_proba)
    best_benchmark = benchmark_df.iloc[0]

    summary_df = pd.DataFrame(
        {
            "Estrategia": [
                f"Mejor benchmark ({best_benchmark['Modelo']})",
                "GB Optimizado (SMOTE + Optuna)",
            ],
            "Test Accuracy": [best_benchmark["Test Accuracy"], optimized_accuracy],
            "Test AUC": [best_benchmark["Test AUC"], optimized_auc],
        }
    )
    print("\nResumen comparativo final:")
    _display_frame(summary_df)

    report_text = classification_report(
        prepared["y_test"],
        y_pred,
        target_names=["Sano (0)", "Con cálculos (1)"],
    )
    print("\nReporte de clasificación del modelo optimizado:")
    print(report_text)
    print("Hiperparámetros fijados para replay determinista del mejor estudio Optuna original:")
    print(replayed_best_params)

    confusion_path = None
    shap_path = None
    if figures_dir is not None and scenario == "rural":
        confusion_path = figures_dir / "rural_confusion_matrix.png"
        shap_path = figures_dir / "rural_feature_importance.png"

    _render_confusion_matrix(
        confusion_matrix(prepared["y_test"], y_pred),
        confusion_path,
        title=f"Matriz de confusión: {scenario}",
    )
    _render_shap_bar_plot(
        final_model,
        prepared["X_test_model"],
        shap_path,
        title=f"Importancia de variables SHAP: {scenario}",
    )

    result = {
        "scenario": scenario,
        "dataset_shape": list(df.shape),
        "feature_count": len(prepared["selected_features"]),
        "selected_features": prepared["selected_features"],
        "excluded_features": excluded_features,
        "benchmark_df": benchmark_df,
        "summary_df": summary_df,
        "classification_report": report_text,
        "best_benchmark_name": best_benchmark["Modelo"],
        "best_benchmark_accuracy": float(best_benchmark["Test Accuracy"]),
        "best_benchmark_auc": float(best_benchmark["Test AUC"]),
        "optimized_model_name": "GB Optimizado (SMOTE + Optuna)",
        "optimized_accuracy": float(optimized_accuracy),
        "optimized_auc": float(optimized_auc),
        "best_params": replayed_best_params,
    }

    if report_path is not None:
        _save_json_report(result, report_path)

    return result


def run_full_experiment(
    data_path: Path,
    *,
    report_path: Path | None = None,
) -> dict:
    return _run_experiment(
        data_path=Path(data_path),
        scenario="replica completa",
        notebook_title="Réplica del paper con variables completas",
        feature_columns=None,
        select_k=32,
        excluded_features=[],
        figures_dir=None,
        report_path=report_path,
    )


def run_rural_experiment(
    data_path: Path,
    *,
    figures_dir: Path,
    report_path: Path | None = None,
) -> dict:
    return _run_experiment(
        data_path=Path(data_path),
        scenario="rural",
        notebook_title="Adaptación rural sin pruebas de laboratorio",
        feature_columns=RURAL_FEATURES,
        select_k=None,
        excluded_features=LAB_EXCLUDED_FEATURES,
        figures_dir=Path(figures_dir),
        report_path=report_path,
    )
