---
name: model-monitoring-evidently
description: Continuous ML model monitoring using Evidently AI, detecting data drift, concept drift, and target prediction decay.
---

# Model Monitoring & Data Drift Detection

## Overview
Monitors live ML predictions against training baselines to detect covariate shift, numerical drift (Kolmogorov-Smirnov test), and categorical drift.

## Automated Drift Alerting
- Compute Wasserstein distance and KS p-value across sliding 7-day prediction windows.
- Trigger automated retraining pipelines when drift score exceeds predefined statistical thresholds.
