---
name: google-workspace-automation
description: Google Workspace API automation for Gmail, Google Sheets, Drive, and Docs with Service Accounts and batch operations.
---

# Google Workspace Automation (Sheets, Gmail, Drive)

## Overview
Automate administrative tasks, data synchronization, document generation, and alert dispatch across Google Sheets, Gmail, and Google Drive using Python and the official Google API Client Libraries with Service Account authentication.

## Authentication Strategy
Use Google Cloud Service Accounts with delegated domain-wide authority or direct IAM sharing:
- Generate Service Account JSON Key via Google Cloud Console.
- Share target Google Sheets / Drive Folders with the Service Account email.
- Scope credentials to least privilege (e.g., `spreadsheets.readonly`, `gmail.send`).

## Implementation Patterns

### 1. Google Sheets High-Throughput Batch Synchronization
```python
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH", "credentials.json")

def get_sheets_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=creds)

def batch_update_spreadsheet(spreadsheet_id: str, sheet_name: str, rows_data: list[list]):
    service = get_sheets_service()
    range_name = f"{sheet_name}!A1"
    body = {"values": rows_data}

    result = (
        service.spreadsheets()
        .values()
        .update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption="USER_ENTERED",
            body=body,
        )
        .execute()
    )

    print(f"Updated {result.get('updatedCells')} cells.")
    return result
```

### 2. Transactional Gmail Dispatch via Service Account
```python
import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build

def send_alert_email(service, sender_email: str, recipient: str, subject: str, message_text: str):
    message = MIMEText(message_text, "html")
    message["to"] = recipient
    message["from"] = sender_email
    message["subject"] = subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {"raw": raw_message}

    return service.users().messages().send(userId="me", body=body).execute()
```

## Best Practices & Quota Hygiene
- **Batch Requests**: Always use `batchUpdate` or `values.batchUpdate` instead of updating cell-by-cell to prevent hitting the 300 requests/minute API quota.
- **Exponential Backoff**: Implement jittered exponential backoff when handling `429 Too Many Requests` responses.
- **Never commit credentials.json**: Inject credentials via environment variables or secret vaults.\n