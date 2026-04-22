from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class ListingStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SOLD = "sold"
    HIDDEN = "hidden"
    REJECTED = "rejected"

class ConditionGrade(str, Enum):
    BRAND_NEW = "brand_new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

class OfferStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"
    EXPIRED = "expired"

class OrderStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class FulfillmentStatus(str, Enum):
    CREATED = "created"
    AWAITING_FUNDING = "awaiting_funding"
    FUNDED = "funded"
    SELLER_MARKED_DELIVERED = "seller_marked_delivered"
    BUYER_CONFIRMED_RECEIVED = "buyer_confirmed_received"
    DISPUTED = "disputed"
    RESOLVED_REFUND = "resolved_refund"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    OFFER_RECEIVED = "offer_received"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    OFFER_COUNTERED = "offer_countered"
    OFFER_EXPIRED = "offer_expired"
    ORDER_CREATED = "order_created"
    ORDER_COMPLETED = "order_completed"
    ORDER_CANCELLED = "order_cancelled"
    ESCROW_FUNDED = "escrow_funded"
    ESCROW_RELEASE_REQUESTED = "escrow_release_requested"
    ESCROW_RELEASED = "escrow_released"
    ESCROW_DISPUTED = "escrow_disputed"
    ESCROW_RESOLVED = "escrow_resolved"
    LISTING_APPROVED = "listing_approved"
    LISTING_REJECTED = "listing_rejected"
    REVIEW_RECEIVED = "review_received"


class WalletTransactionType(str, Enum):
    TOPUP_DEMO = "topup_demo"
    HOLD = "hold"
    RELEASE = "release"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class WalletTransactionDirection(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class EscrowStatus(str, Enum):
    AWAITING_FUNDING = "awaiting_funding"
    HELD = "held"
    RELEASE_PENDING = "release_pending"
    RELEASED = "released"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class EscrowEventType(str, Enum):
    CREATED = "created"
    FUNDED = "funded"
    HOLD = "hold"
    SELLER_MARK_DELIVERED = "seller_mark_delivered"
    BUYER_CONFIRM = "buyer_confirm"
    DISPUTE_OPENED = "dispute_opened"
    RELEASE = "release"
    REFUND = "refund"
    ADMIN_RESOLVE = "admin_resolve"
