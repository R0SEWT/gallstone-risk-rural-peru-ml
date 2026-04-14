from __future__ import annotations

import json
import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.feature_selection import SelectFromModel, SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import RepeatedStratifiedKFold, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from portfolio_pipeline import (
    RECORDED_OPTUNA_PARAMS,
    RURAL_FEATURES,
    SEED,
    TARGET_COLUMN,
    configure_style,
    set_global_seed,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "dataset-uci.xlsx"
OUTPUT_DIR = ROOT / "results" / "ml"

CV_SPLITS = 5
CV_REPEATS = 3

REPEATED_CV = RepeatedStratifiedKFold(n_splits=CV_SPLITS, n_repeats=CV_REPEATS, random_state=SEED)
OOF_CV = StratifiedKFold(n_splits=CV_SPLITS, shuffle=True, random_state=SEED)
RURAL_ANOVA_K = 15


def load_dataset() -> pd.DataFrame:
    return pd.read_excel(DATA_PATH)


def get_scenarios(df: pd.DataFrame) -> dict[str, tuple[pd.DataFrame, pd.Series]]:
    return {
        "replica_completa": (
            df.drop(columns=[TARGET_COLUMN]).copy(),
            df[TARGET_COLUMN].copy(),
        ),
        "rural": (
            df[RURAL_FEATURES].copy(),
            df[TARGET_COLUMN].copy(),
        ),
    }


def full_model_builders() -> dict[str, callable]:
    return {
        "ElasticNet LR (all features)": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        penalty="elasticnet",
                        solver="saga",
                        l1_ratio=0.5,
                        C=0.5,
                        max_iter=5000,
                        random_state=SEED,
                    ),
                ),
            ]
        ),
        "XGBoost (ANOVA32)": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                ("select", SelectKBest(score_func=f_classif, k=32)),
                (
                    "model",
                    XGBClassifier(
                        eval_metric="logloss",
                        use_label_encoder=False,
                        random_state=SEED,
                        learning_rate=0.1,
                        max_depth=3,
                        n_estimators=200,
                        n_jobs=-1,
                        verbosity=0,
                    ),
                ),
            ]
        ),
        "GB (ANOVA32)": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                ("select", SelectKBest(score_func=f_classif, k=32)),
                (
                    "model",
                    GradientBoostingClassifier(
                        random_state=SEED,
                        **RECORDED_OPTUNA_PARAMS["replica completa"],
                    ),
                ),
            ]
        ),
    }


def rural_model_builders() -> dict[str, callable]:
    return {
        "ElasticNet LR (rural)": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        penalty="elasticnet",
                        solver="saga",
                        l1_ratio=0.5,
                        C=0.5,
                        max_iter=5000,
                        random_state=SEED,
                    ),
                ),
            ]
        ),
        "XGBoost (rural benchmark)": lambda: XGBClassifier(
            eval_metric="logloss",
            use_label_encoder=False,
            random_state=SEED,
            learning_rate=0.1,
            n_estimators=200,
            n_jobs=-1,
            verbosity=0,
        ),
        "GB (rural current)": lambda: GradientBoostingClassifier(
            random_state=SEED,
            **RECORDED_OPTUNA_PARAMS["rural"],
        ),
        "Calibrated GB (isotonic)": lambda: CalibratedClassifierCV(
            estimator=GradientBoostingClassifier(
                random_state=SEED,
                **RECORDED_OPTUNA_PARAMS["rural"],
            ),
            method="isotonic",
            cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=SEED),
        ),
    }


def rural_feature_scheme_builders() -> dict[str, callable]:
    return {
        "All 25 + ElasticNet LR": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        penalty="elasticnet",
                        solver="saga",
                        l1_ratio=0.5,
                        C=0.5,
                        max_iter=5000,
                        random_state=SEED,
                    ),
                ),
            ]
        ),
        "ANOVA15 + ElasticNet LR": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                ("select", SelectKBest(score_func=f_classif, k=RURAL_ANOVA_K)),
                (
                    "model",
                    LogisticRegression(
                        penalty="elasticnet",
                        solver="saga",
                        l1_ratio=0.5,
                        C=0.5,
                        max_iter=5000,
                        random_state=SEED,
                    ),
                ),
            ]
        ),
        "L1 select + LR": lambda: Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "select",
                    SelectFromModel(
                        LogisticRegression(
                            penalty="l1",
                            solver="saga",
                            C=0.1,
                            max_iter=5000,
                            random_state=SEED,
                        ),
                        threshold=1e-5,
                    ),
                ),
                (
                    "model",
                    LogisticRegression(
                        penalty="l2",
                        solver="liblinear",
                        C=1.0,
                        max_iter=5000,
                        random_state=SEED,
                    ),
                ),
            ]
        ),
    }


def model_probabilities(model, X_test: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X_test)[:, 1]
    raise ValueError(f"El modelo {type(model).__name__} no expone predict_proba.")


def fold_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> dict[str, float]:
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "roc_auc": roc_auc_score(y_true, y_prob),
        "pr_auc": average_precision_score(y_true, y_prob),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "balanced_accuracy": balanced_accuracy_score(y_true, y_pred),
        "specificity": specificity,
        "brier_score": brier_score_loss(y_true, y_prob),
        "threshold": threshold,
    }


def evaluate_repeated_cv(
    X: pd.DataFrame,
    y: pd.Series,
    scenario: str,
    model_builders: dict[str, callable],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    metric_rows: list[dict] = []
    prediction_rows: list[dict] = []

    for model_name, builder in model_builders.items():
        for split_index, (train_idx, test_idx) in enumerate(REPEATED_CV.split(X, y), start=1):
            repeat = ((split_index - 1) // CV_SPLITS) + 1
            fold = ((split_index - 1) % CV_SPLITS) + 1

            X_train = X.iloc[train_idx]
            X_test = X.iloc[test_idx]
            y_train = y.iloc[train_idx]
            y_test = y.iloc[test_idx]

            model = builder()
            model.fit(X_train, y_train)
            y_prob = model_probabilities(model, X_test)
            metrics = fold_metrics(y_test.to_numpy(), y_prob)

            metric_rows.append(
                {
                    "scenario": scenario,
                    "model": model_name,
                    "repeat": repeat,
                    "fold": fold,
                    **metrics,
                }
            )

            prediction_rows.extend(
                {
                    "scenario": scenario,
                    "model": model_name,
                    "repeat": repeat,
                    "fold": fold,
                    "row_index": int(index),
                    "y_true": int(target),
                    "y_prob": float(prob),
                }
                for index, target, prob in zip(X_test.index, y_test.to_numpy(), y_prob)
            )

    return pd.DataFrame(metric_rows), pd.DataFrame(prediction_rows)


def summarize_metrics(metric_df: pd.DataFrame) -> pd.DataFrame:
    metrics = [
        "accuracy",
        "roc_auc",
        "pr_auc",
        "precision",
        "recall",
        "f1",
        "balanced_accuracy",
        "specificity",
        "brier_score",
    ]
    summary = metric_df.groupby(["scenario", "model"])[metrics].agg(["mean", "std"]).round(4)
    summary.columns = [f"{metric}_{stat}" for metric, stat in summary.columns]
    return summary.reset_index()


def save_metric_boxplot(metric_df: pd.DataFrame, output_path: Path, title: str) -> None:
    plot_metrics = ["roc_auc", "pr_auc", "balanced_accuracy", "recall", "specificity", "brier_score"]
    melted = metric_df.melt(
        id_vars=["scenario", "model"],
        value_vars=plot_metrics,
        var_name="metric",
        value_name="value",
    )
    fig, axes = plt.subplots(2, 3, figsize=(16, 9))
    for ax, metric in zip(axes.flatten(), plot_metrics):
        sns.boxplot(data=melted[melted["metric"] == metric], x="model", y="value", ax=ax, color="#8ecae6")
        ax.set_title(metric)
        ax.tick_params(axis="x", rotation=20)
        ax.set_xlabel("")
    fig.suptitle(title, y=1.02, fontsize=16, fontweight="bold")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def collect_oof_predictions(
    X: pd.DataFrame,
    y: pd.Series,
    model_name: str,
    builder: callable,
) -> pd.DataFrame:
    rows = []
    for fold, (train_idx, test_idx) in enumerate(OOF_CV.split(X, y), start=1):
        model = builder()
        model.fit(X.iloc[train_idx], y.iloc[train_idx])
        y_prob = model_probabilities(model, X.iloc[test_idx])
        rows.extend(
            {
                "model": model_name,
                "fold": fold,
                "row_index": int(index),
                "y_true": int(target),
                "y_prob": float(prob),
            }
            for index, target, prob in zip(X.iloc[test_idx].index, y.iloc[test_idx].to_numpy(), y_prob)
        )
    return pd.DataFrame(rows)


def save_rural_curve_figure(predictions: pd.DataFrame, output_path: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    for model_name, color in [
        ("GB (rural current)", "#1d3557"),
        ("Calibrated GB (isotonic)", "#e76f51"),
    ]:
        frame = predictions[predictions["model"] == model_name]
        fpr, tpr, _ = roc_curve(frame["y_true"], frame["y_prob"])
        precision, recall, _ = precision_recall_curve(frame["y_true"], frame["y_prob"])
        roc_auc = roc_auc_score(frame["y_true"], frame["y_prob"])
        pr_auc = average_precision_score(frame["y_true"], frame["y_prob"])
        axes[0].plot(fpr, tpr, label=f"{model_name} (AUC={roc_auc:.3f})", color=color)
        axes[1].plot(recall, precision, label=f"{model_name} (PR-AUC={pr_auc:.3f})", color=color)

    axes[0].plot([0, 1], [0, 1], linestyle="--", color="gray")
    axes[0].set_title("ROC rural")
    axes[0].set_xlabel("False Positive Rate")
    axes[0].set_ylabel("True Positive Rate")
    axes[0].legend()

    axes[1].set_title("Precision-Recall rural")
    axes[1].set_xlabel("Recall")
    axes[1].set_ylabel("Precision")
    axes[1].legend()

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def save_calibration_figure(predictions: pd.DataFrame, output_path: Path) -> None:
    fig, ax = plt.subplots(figsize=(8, 6))
    for model_name, color in [
        ("GB (rural current)", "#1d3557"),
        ("Calibrated GB (isotonic)", "#e76f51"),
    ]:
        frame = predictions[predictions["model"] == model_name]
        frac_pos, mean_pred = calibration_curve(frame["y_true"], frame["y_prob"], n_bins=8, strategy="quantile")
        ax.plot(mean_pred, frac_pos, marker="o", label=model_name, color=color)

    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Perfect calibration")
    ax.set_title("Calibration curve rural")
    ax.set_xlabel("Predicted probability")
    ax.set_ylabel("Observed frequency")
    ax.legend()
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def save_threshold_table(predictions: pd.DataFrame, output_csv: Path, output_png: Path) -> pd.DataFrame:
    calibrated = predictions[predictions["model"] == "Calibrated GB (isotonic)"]
    rows = []
    for threshold in np.arange(0.20, 0.85, 0.05):
        metrics = fold_metrics(calibrated["y_true"].to_numpy(), calibrated["y_prob"].to_numpy(), threshold=round(float(threshold), 2))
        rows.append(
            {
                "threshold": round(float(threshold), 2),
                "recall": metrics["recall"],
                "specificity": metrics["specificity"],
                "precision": metrics["precision"],
                "balanced_accuracy": metrics["balanced_accuracy"],
                "false_negatives": int(((calibrated["y_true"] == 1) & (calibrated["y_prob"] < threshold)).sum()),
                "false_positives": int(((calibrated["y_true"] == 0) & (calibrated["y_prob"] >= threshold)).sum()),
            }
        )

    threshold_df = pd.DataFrame(rows).round(4)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    threshold_df.to_csv(output_csv, index=False)

    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.axis("off")
    table_frame = threshold_df.copy()
    for column in ["recall", "specificity", "precision", "balanced_accuracy"]:
        table_frame[column] = table_frame[column].map(lambda value: f"{value:.3f}")
    table = ax.table(
        cellText=table_frame.values,
        colLabels=table_frame.columns,
        cellLoc="center",
        colLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1, 1.35)
    ax.set_title("Tabla de umbrales para screening rural", pad=16, fontweight="bold")
    fig.tight_layout()
    fig.savefig(output_png, dpi=200)
    plt.close(fig)
    return threshold_df


def compute_feature_stability(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    rows = []
    for split_index, (train_idx, _test_idx) in enumerate(REPEATED_CV.split(X, y), start=1):
        repeat = ((split_index - 1) // CV_SPLITS) + 1
        fold = ((split_index - 1) % CV_SPLITS) + 1

        X_train = X.iloc[train_idx]
        y_train = y.iloc[train_idx]

        scaler = StandardScaler()
        X_train_scaled = pd.DataFrame(
            scaler.fit_transform(X_train),
            columns=X_train.columns,
            index=X_train.index,
        )

        anova = SelectKBest(score_func=f_classif, k=RURAL_ANOVA_K)
        anova.fit(X_train_scaled, y_train)
        for feature in X_train.columns[anova.get_support()]:
            rows.append({"scheme": "ANOVA top 15", "repeat": repeat, "fold": fold, "feature": feature})

        l1 = LogisticRegression(
            penalty="l1",
            solver="saga",
            C=0.1,
            max_iter=5000,
            random_state=SEED,
        )
        l1.fit(X_train_scaled, y_train)
        selected = X_train.columns[np.abs(l1.coef_[0]) > 1e-6]
        for feature in selected:
            rows.append({"scheme": "L1 non-zero", "repeat": repeat, "fold": fold, "feature": feature})

    selection_df = pd.DataFrame(rows)
    stability = (
        selection_df.groupby(["scheme", "feature"])
        .size()
        .reset_index(name="selected_folds")
        .sort_values(["scheme", "selected_folds", "feature"], ascending=[True, False, True])
    )
    total_folds = CV_SPLITS * CV_REPEATS
    stability["selection_rate"] = (stability["selected_folds"] / total_folds).round(4)
    return stability


def save_feature_stability_plot(stability: pd.DataFrame, output_path: Path) -> None:
    plot_frame = stability[stability["selection_rate"] >= 0.2].copy()
    fig, axes = plt.subplots(1, 2, figsize=(14, 7), sharex=False)
    for ax, scheme in zip(axes, ["ANOVA top 15", "L1 non-zero"]):
        subset = plot_frame[plot_frame["scheme"] == scheme].sort_values("selection_rate", ascending=True)
        sns.barplot(data=subset, x="selection_rate", y="feature", ax=ax, color="#90be6d")
        ax.set_title(scheme)
        ax.set_xlabel("Selection rate across folds")
        ax.set_ylabel("")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))


def main() -> None:
    warnings.filterwarnings("ignore")
    set_global_seed()
    configure_style()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()
    scenarios = get_scenarios(df)

    full_X, full_y = scenarios["replica_completa"]
    rural_X, rural_y = scenarios["rural"]

    full_metrics, _ = evaluate_repeated_cv(full_X, full_y, "replica_completa", full_model_builders())
    rural_metrics, _ = evaluate_repeated_cv(rural_X, rural_y, "rural", rural_model_builders())
    feature_scheme_metrics, _ = evaluate_repeated_cv(rural_X, rural_y, "rural_feature_schemes", rural_feature_scheme_builders())

    full_summary = summarize_metrics(full_metrics)
    rural_summary = summarize_metrics(rural_metrics)
    feature_scheme_summary = summarize_metrics(feature_scheme_metrics)

    full_metrics.to_csv(OUTPUT_DIR / "full_repeated_cv_metrics.csv", index=False)
    rural_metrics.to_csv(OUTPUT_DIR / "rural_repeated_cv_metrics.csv", index=False)
    feature_scheme_metrics.to_csv(OUTPUT_DIR / "rural_feature_scheme_metrics.csv", index=False)
    full_summary.to_csv(OUTPUT_DIR / "full_repeated_cv_summary.csv", index=False)
    rural_summary.to_csv(OUTPUT_DIR / "rural_repeated_cv_summary.csv", index=False)
    feature_scheme_summary.to_csv(OUTPUT_DIR / "rural_feature_scheme_summary.csv", index=False)

    save_metric_boxplot(
        full_metrics,
        OUTPUT_DIR / "full_repeated_cv_boxplots.png",
        title="Réplica completa: distribución de métricas por fold",
    )
    save_metric_boxplot(
        rural_metrics,
        OUTPUT_DIR / "rural_repeated_cv_boxplots.png",
        title="Escenario rural: distribución de métricas por fold",
    )
    save_metric_boxplot(
        feature_scheme_metrics,
        OUTPUT_DIR / "rural_feature_scheme_boxplots.png",
        title="Escenario rural: comparación de esquemas de features",
    )

    rural_oof_predictions = pd.concat(
        [
            collect_oof_predictions(rural_X, rural_y, model_name, builder)
            for model_name, builder in {
                "GB (rural current)": rural_model_builders()["GB (rural current)"],
                "Calibrated GB (isotonic)": rural_model_builders()["Calibrated GB (isotonic)"],
            }.items()
        ],
        ignore_index=True,
    )
    rural_oof_predictions.to_csv(OUTPUT_DIR / "rural_oof_predictions.csv", index=False)

    save_rural_curve_figure(rural_oof_predictions, OUTPUT_DIR / "rural_roc_pr_curves.png")
    save_calibration_figure(rural_oof_predictions, OUTPUT_DIR / "rural_calibration_curve.png")
    threshold_df = save_threshold_table(
        rural_oof_predictions,
        OUTPUT_DIR / "rural_threshold_table.csv",
        OUTPUT_DIR / "rural_threshold_table.png",
    )

    stability = compute_feature_stability(rural_X, rural_y)
    stability.to_csv(OUTPUT_DIR / "rural_feature_stability.csv", index=False)
    save_feature_stability_plot(stability, OUTPUT_DIR / "rural_feature_stability.png")

    summary_payload = {
        "paper_reported_accuracy": 0.8542,
        "release_dataset_shape": list(df.shape),
        "release_class_counts": {str(key): int(value) for key, value in df[TARGET_COLUMN].value_counts().sort_index().items()},
        "artifacts": {
            "full_summary": "results/ml/full_repeated_cv_summary.csv",
            "rural_summary": "results/ml/rural_repeated_cv_summary.csv",
            "feature_scheme_summary": "results/ml/rural_feature_scheme_summary.csv",
            "threshold_table": "results/ml/rural_threshold_table.csv",
            "feature_stability": "results/ml/rural_feature_stability.csv",
        },
        "recommended_rural_thresholds_preview": threshold_df.head(3).to_dict(orient="records"),
    }
    save_json(OUTPUT_DIR / "validation_manifest.json", summary_payload)


if __name__ == "__main__":
    main()
