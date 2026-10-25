---
name: infrastructure-cost-finops
description: Cloud cost optimization, FinOps workflows, idle resource detection, spot instance strategies, and rightsizing.
---

# Cloud FinOps & Cost Optimization

## Overview
Identifies infrastructure waste, optimizes cloud spend, and establishes continuous cost monitoring across AWS, GCP, and cloud services.

## High-Impact FinOps Levers
1. **Unattached Volumes & IPs**: Auto-cleanup orphaned EBS/persistent disks and unattached elastic IPs.
2. **Rightsizing**: Analyze CPU/Memory utilization over 14 days; downsize any instance with < 15% peak utilization.
3. **Spot / Preemptible Instances**: Move non-critical batch workers, test environments, and CI runners to spot pools (saving 60-80%).
4. **Log Retention**: Restrict non-production log groups to 7 days retention.
