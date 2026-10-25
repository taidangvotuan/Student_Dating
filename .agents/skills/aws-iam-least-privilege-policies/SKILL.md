---
name: aws-iam-least-privilege-policies
description: IAM policy engineering, principle of least privilege, permission boundaries, and SCPs (Service Control Policies).
---

# AWS IAM Least-Privilege Policy Engineering

## Overview
Prevents lateral privilege escalation in cloud environments by scoping AWS IAM policies strictly to required actions and resource ARNs.

## Anti-Patterns to Ban
- ❌ `"Action": "*"` or `"Resource": "*"`.
- ❌ Long-lived static access keys; mandate short-lived STS credentials.
