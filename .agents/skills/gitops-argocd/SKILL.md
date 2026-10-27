---
name: gitops-argocd
description: Declarative GitOps continuous delivery with ArgoCD, sync policies, automated rollbacks, and sync wave sequencing.
---

# GitOps Continuous Delivery with ArgoCD

## Overview
Maintains Kubernetes cluster state strictly synchronized with Git repository declarations, providing auditability and one-click disaster recovery.

## ArgoCD Application Spec
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: production-cluster-apps
spec:
  project: default
  source:
    repoURL: 'https://github.com/org/k8s-manifests.git'
    targetRevision: main
    path: environments/production
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```
