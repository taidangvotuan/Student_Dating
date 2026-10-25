---
name: aws-eks-managed-kubernetes
description: AWS Elastic Kubernetes Service (EKS) architecture, managed node groups, Karpenter autoscaling, and IRSA (IAM Roles for Service Accounts).
---

# AWS EKS & Karpenter Autoscaling

## Overview
Scales enterprise Kubernetes clusters with automated, just-in-time EC2 node provisioning via Karpenter and secure AWS IAM pod authentication.

## Karpenter NodePool Spec
Configure Karpenter to provision spot and on-demand instances based on pending pod resource requests in seconds.
