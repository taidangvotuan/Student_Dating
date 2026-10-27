---
name: terraform-modular-iac
description: Production Terraform architecture with reusable modules, remote S3/GCS state locking, drift detection, and automated validation.
---

# Modular Infrastructure as Code with Terraform

## Overview
Guides the creation of scalable, maintainable Terraform modules across development, staging, and production environments with zero state lock conflicts.

## Directory Structure Pattern
```
terraform/
├── modules/
│   ├── vpc/
│   ├── rds/
│   └── compute/
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── backend.tf
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── backend.tf
```

## State Locking & Backend Setup (AWS S3 + DynamoDB)
```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "corp-terraform-state-prod"
    key            = "services/app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

## Verification & Safe Execution Workflow
1. `terraform fmt -check` (Format compliance)
2. `tflint` (Static linting)
3. `terraform plan -out=tfplan` (Explicit execution plan)
4. `terraform apply tfplan` (Apply plan strictly)
