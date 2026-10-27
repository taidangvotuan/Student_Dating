---
name: embedded-rtos-freertos
description: Real-time embedded programming with FreeRTOS, task scheduling, mutex priority inversion, and interrupt service routines (ISR).
---

# Embedded Systems & FreeRTOS Architecture

## Overview
Designs deterministic, low-power real-time embedded firmware running on ARM Cortex-M microcontrollers.

## Safety Invariants
- Never call blocking RTOS functions inside an Interrupt Service Routine (ISR).
- Use priority inheritance mutexes to prevent priority inversion bugs.
