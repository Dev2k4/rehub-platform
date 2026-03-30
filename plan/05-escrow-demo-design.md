# 05 - Escrow Demo Design (No Real Money)

## 1) Goal

Build a demo escrow flow to validate order trust and dispute handling before integrating real payment gateways.

This demo uses virtual balances only. No bank card, no real transfer.

## 2) Why This Solves Current Pain

Current order flow allows buyer to mark completed too early. There is no economic lock and no explicit dispute path.

Escrow demo introduces:
- Funds lock at order creation.
- Controlled release only after delivery confirmation.
- Refund path for disputes/cancellations.
- Full transaction audit trail.

## 3) Scope (Demo)

In scope:
- Virtual wallet per user.
- Escrow ledger for each order.
- Hold, release, refund actions.
- Dispute state and admin resolution.
- Notifications for each event.

Out of scope:
- Real payment gateways (Momo, Stripe, VNPay, banking).
- KYC/AML checks.
- Withdrawal to bank.

## 4) Domain Model

### 4.1 WalletAccount
- id
- user_id (unique)
- available_balance (decimal)
- locked_balance (decimal)
- created_at
- updated_at

### 4.2 WalletTransaction
- id
- user_id
- order_id (nullable)
- type: topup_demo | hold | release | refund | adjustment
- amount
- direction: credit | debit
- balance_after
- metadata (json)
- created_at

### 4.3 Escrow
- id
- order_id (unique)
- buyer_id
- seller_id
- amount
- status: awaiting_funding | held | release_pending | released | refunded | disputed
- funded_at
- released_at
- refunded_at
- created_at
- updated_at

### 4.4 EscrowEvent
- id
- escrow_id
- actor_id
- event_type: created | funded | hold | seller_mark_delivered | buyer_confirm | dispute_opened | release | refund | admin_resolve
- note
- data (json)
- created_at

## 5) Order + Escrow State Machine

Order state (proposal):
- pending_seller_confirm
- seller_confirmed
- delivered_pending_buyer_confirm
- completed
- cancelled
- disputed

Escrow state mapping:
- order created + buyer funded -> held
- seller delivered -> release_pending
- buyer confirmed -> released
- cancel/dispute buyer wins -> refunded
- dispute admin seller wins -> released

## 6) API Proposal

Wallet APIs:
- POST /api/v1/wallet/demo-topup { amount }
- GET /api/v1/wallet/me
- GET /api/v1/wallet/transactions

Escrow APIs:
- GET /api/v1/escrows/{order_id}
- POST /api/v1/escrows/{order_id}/fund
- POST /api/v1/escrows/{order_id}/release-request (seller marks delivered)
- POST /api/v1/escrows/{order_id}/confirm-release (buyer confirms)
- POST /api/v1/escrows/{order_id}/refund-request
- POST /api/v1/escrows/{order_id}/open-dispute

Admin APIs:
- POST /api/v1/admin/escrows/{order_id}/resolve
  - body: { result: release | refund, note: string }

## 7) Transaction Rules

- fund:
  - debit buyer.available
  - credit buyer.locked
  - escrow status -> held

- release:
  - debit buyer.locked
  - credit seller.available
  - escrow status -> released

- refund:
  - debit buyer.locked
  - credit buyer.available
  - escrow status -> refunded

All operations must run in one DB transaction with row lock on wallet accounts and escrow row.

## 8) Fraud Controls (No Payment)

- Buyer cannot confirm complete before seller release-request.
- Seller cannot release funds directly.
- Dispute freezes escrow until admin resolution.
- Auto-release timer optional (e.g. 72h after delivered if no dispute).
- Every action writes EscrowEvent and WalletTransaction.

## 9) Minimal UI Changes

Buyer view:
- Wallet balance card.
- Fund Escrow button on order detail.
- Confirm receipt button after seller marks delivered.
- Open dispute button.

Seller view:
- Mark delivered button.
- Escrow status badge.

Admin view:
- Escrow dispute queue.
- Resolve to release or refund.

## 10) Implementation Plan (Phased)

Phase A (2-3 days):
- Add wallet + escrow models + migration.
- Add demo topup and fund endpoints.
- Link order creation with optional escrow creation.

Phase B (2-3 days):
- Add release-request, confirm-release, refund, dispute APIs.
- Add state guards and notification events.
- Add backend tests for transitions and balances.

Phase C (2-3 days):
- Add frontend wallet and order escrow actions.
- Add admin dispute resolve UI.
- Run end-to-end demo scenarios.

## 11) Success Criteria

- Cannot complete order without escrow release path.
- No negative balance after any operation.
- Every monetary move has a WalletTransaction row.
- Disputed order cannot be auto-completed.
- Happy path and dispute path both pass tests.

## 12) Migration to Real Payment Later

When integrating real gateway:
- Keep WalletAccount, WalletTransaction, Escrow.
- Replace demo-topup by provider callback credit.
- Add payment_intent table and provider_reference.
- Keep dispute and release logic unchanged.
