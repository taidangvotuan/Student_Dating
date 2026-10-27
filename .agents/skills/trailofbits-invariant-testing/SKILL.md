---
name: trailofbits-invariant-testing
description: Trail of Bits style invariant testing, property-based fuzzing with Hypothesis/Echidna, and discovering edge-case states in critical business logic.
---

# Trail of Bits Invariant & Property-Based Testing

## Overview
Moves beyond traditional example-based unit testing by proving that mathematical invariants hold true across millions of pseudo-random, adversarial inputs.

## The Invariant Testing Mindset
- **Unit test**: "If I deposit \$10 and withdraw \$4, balance is \$6."
- **Invariant test**: "No sequence of arbitrary deposits, withdrawals, and currency exchanges can ever cause `account_balance < 0` or cause `total_system_holdings != sum(user_balances)`."

## Python Invariant Testing with Hypothesis
```python
from hypothesis import given, strategies as st
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant

class BankAccountStateMachine(RuleBasedStateMachine):
    def __init__(self):
        super().__init__()
        self.balance = 0

    @rule(amount=st.integers(min_value=1, max_value=10000))
    def deposit(self, amount):
        self.balance += amount

    @rule(amount=st.integers(min_value=1, max_value=10000))
    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount

    @invariant()
    def balance_never_negative(self):
        assert self.balance >= 0, f"Invariant violated: balance is {self.balance}"

TestBank = BankAccountStateMachine.TestCase
```
