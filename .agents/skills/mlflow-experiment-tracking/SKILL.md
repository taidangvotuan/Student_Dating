---
name: mlflow-experiment-tracking
description: MLflow model lifecycle management, hyperparameter logging, artifact registry, and production model staging.
---

# MLflow Experiment Tracking & Model Registry

## Overview
Tracks hyperparameter iterations, evaluation metrics, and model artifacts with reproducible Git commit hashes and artifact lineage.

## Implementation Pattern
```python
import mlflow

with mlflow.start_run(run_name="xgboost_baseline"):
    mlflow.log_params({"max_depth": 6, "learning_rate": 0.05})
    # Train model...
    mlflow.log_metrics({"val_auc": 0.942, "val_loss": 0.18})
    mlflow.sklearn.log_model(model, "model")
```
