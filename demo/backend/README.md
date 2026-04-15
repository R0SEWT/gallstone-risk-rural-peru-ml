---
title: Gallstone Risk Demo
emoji: 🩺
colorFrom: green
colorTo: gray
sdk: docker
app_port: 8000
pinned: false
license: mit
short_description: Rural adaptation of UCI Gallstone (GB + SHAP + bioimpedance)
---

# Gallstone Risk — FastAPI backend

Rural-adaptation inference API for a gallstone disease ML case study.
Serves a scikit-learn `Pipeline(StandardScaler → GradientBoostingClassifier)`
trained on the UCI Gallstone dataset (319 records, 25 features — no blood lab
work), plus a SHAP `TreeExplainer` and a bioimpedance template generator.

- **Model metrics:** Accuracy 0.7708, AUC 0.8138
- **Frontend:** [gallstone.rosewt.dev](https://gallstone.rosewt.dev) (Next.js / Vercel)
- **Source:** [github.com/rosewt-upc/WinterProject](https://github.com/rosewt-upc/WinterProject)

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + model/explainer load state |
| `GET` | `/model/info` | Metrics JSON from training run |
| `POST` | `/predict/rural` | 25-feature payload → probability + risk_level |
| `POST` | `/explain/rural` | Same payload → SHAP values + base_value |
| `POST` | `/generate/bioimpedance` | Demographics → 15 synthetic bioimpedance vars |

Validate with the Postman collection shipped in the source repo
(`demo/backend/postman_collection.json`, 31 assertions).

---

_Academic project · UPC 2024 · Does not replace medical diagnosis._
