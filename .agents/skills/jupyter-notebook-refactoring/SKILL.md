---
name: jupyter-notebook-refactoring
description: Refactoring exploratory Jupyter notebooks into modular, tested, and maintainable production Python packages.
---

# Jupyter Notebook Refactoring to Production Code

## Overview
Converts messy, stateful `.ipynb` notebooks into clean, type-hinted Python modules with unit tests and clear CLI entry points.

## Refactoring Protocol
1. **Extract Hidden Global State**: Eliminate reliance on out-of-order cell execution. Pass all data explicitly through function parameters.
2. **Move Logic to `src/`**: Move pure functions into `.py` files; import them into the notebook for presentation only.
3. **Add Docstrings & Tests**: Add pytest unit tests for every core transformation routine.
