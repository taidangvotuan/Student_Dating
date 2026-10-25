---
name: sql-injection-blind-timing
description: Detecting and mitigating Blind and Time-Based SQL Injection vulnerabilities with prepared statements and query parsers.
---

# Blind & Time-Based SQL Injection Defense

## Overview
Defends against subtle SQL injections where no error or data is returned directly to the user, but backend delay functions (`pg_sleep`, `WAITFOR DELAY`) leak schema data.

## Golden Rule
Never concatenate strings into SQL queries. Always pass user inputs as typed parameters to prepared statements.
