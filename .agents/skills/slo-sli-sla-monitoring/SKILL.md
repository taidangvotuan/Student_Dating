---
name: slo-sli-sla-monitoring
description: Defining Service Level Objectives (SLOs), Service Level Indicators (SLIs), and error budget burn rate alerting.
---

# Service Level Objectives (SLOs) & Error Budgets

## Overview
Balances engineering release velocity with service reliability by tracking consumable error budgets.

## Standard Formulations
- **SLI (Indicator)**: `Successful Requests / Total Valid Requests`
- **SLO (Objective)**: Target reliability over a 30-day rolling window (e.g., `99.9%`).
- **Error Budget**: `100% - SLO` (For 99.9%, budget is 0.1% or 43.2 minutes of downtime/month).

## Multi-Window Burn Rate Alerts
- Alert if budget burns 14.4x in 1 hour (exhausts 100% budget in 2 days) -> Immediate Pager.
- Alert if budget burns 6x in 6 hours (exhausts 100% budget in 5 days) -> Ticket.
