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


class NotificationType(str, Enum):
    OFFER_RECEIVED = "offer_received"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    OFFER_COUNTERED = "offer_countered"
    OFFER_EXPIRED = "offer_expired"
    ORDER_CREATED = "order_created"
    ORDER_COMPLETED = "order_completed"
    ORDER_CANCELLED = "order_cancelled"
    LISTING_APPROVED = "listing_approved"
    LISTING_REJECTED = "listing_rejected"
    REVIEW_RECEIVED = "review_received"
