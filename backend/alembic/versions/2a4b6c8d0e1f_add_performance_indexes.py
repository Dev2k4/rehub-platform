"""Add performance indexes

Revision ID: 2a4b6c8d0e1f
Revises: 1af3dfac5e8b
Create Date: 2026-03-23

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2a4b6c8d0e1f'
down_revision: Union[str, Sequence[str], None] = '1af3dfac5e8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes for performance optimization."""

    # Users table
    op.create_index('idx_users_role', 'users', ['role'])
    op.create_index('idx_users_is_active', 'users', ['is_active'])

    # Categories table
    op.create_index('idx_categories_parent_id', 'categories', ['parent_id'])

    # Listings table - critical for search/filtering
    op.create_index('idx_listings_seller_id', 'listings', ['seller_id'])
    op.create_index('idx_listings_category_id', 'listings', ['category_id'])
    op.create_index('idx_listings_status', 'listings', ['status'])
    op.create_index('idx_listings_status_created', 'listings', ['status', 'created_at'])
    op.create_index('idx_listings_price', 'listings', ['price'])

    # Listing images - for batch loading (N+1 fix)
    op.create_index('idx_listing_images_listing_id', 'listing_images', ['listing_id'])

    # Offers table
    op.create_index('idx_offers_listing_id', 'offers', ['listing_id'])
    op.create_index('idx_offers_buyer_id', 'offers', ['buyer_id'])
    op.create_index('idx_offers_status', 'offers', ['status'])
    op.create_index('idx_offers_listing_status', 'offers', ['listing_id', 'status'])

    # Orders table
    op.create_index('idx_orders_buyer_id', 'orders', ['buyer_id'])
    op.create_index('idx_orders_seller_id', 'orders', ['seller_id'])
    op.create_index('idx_orders_listing_id', 'orders', ['listing_id'])
    op.create_index('idx_orders_status', 'orders', ['status'])

    # Notifications table - critical for real-time
    op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('idx_notifications_created', 'notifications', ['created_at'])
    # Partial index for unread notifications (PostgreSQL specific)
    op.create_index(
        'idx_notifications_user_unread',
        'notifications',
        ['user_id', 'is_read'],
        postgresql_where='is_read = false'
    )

    # Reviews table
    op.create_index('idx_reviews_reviewer_id', 'reviews', ['reviewer_id'])
    op.create_index('idx_reviews_reviewee_id', 'reviews', ['reviewee_id'])
    op.create_index('idx_reviews_order_id', 'reviews', ['order_id'])


def downgrade() -> None:
    """Remove performance indexes."""

    # Reviews
    op.drop_index('idx_reviews_order_id', table_name='reviews')
    op.drop_index('idx_reviews_reviewee_id', table_name='reviews')
    op.drop_index('idx_reviews_reviewer_id', table_name='reviews')

    # Notifications
    op.drop_index('idx_notifications_user_unread', table_name='notifications')
    op.drop_index('idx_notifications_created', table_name='notifications')
    op.drop_index('idx_notifications_user_id', table_name='notifications')

    # Orders
    op.drop_index('idx_orders_status', table_name='orders')
    op.drop_index('idx_orders_listing_id', table_name='orders')
    op.drop_index('idx_orders_seller_id', table_name='orders')
    op.drop_index('idx_orders_buyer_id', table_name='orders')

    # Offers
    op.drop_index('idx_offers_listing_status', table_name='offers')
    op.drop_index('idx_offers_status', table_name='offers')
    op.drop_index('idx_offers_buyer_id', table_name='offers')
    op.drop_index('idx_offers_listing_id', table_name='offers')

    # Listing images
    op.drop_index('idx_listing_images_listing_id', table_name='listing_images')

    # Listings
    op.drop_index('idx_listings_price', table_name='listings')
    op.drop_index('idx_listings_status_created', table_name='listings')
    op.drop_index('idx_listings_status', table_name='listings')
    op.drop_index('idx_listings_category_id', table_name='listings')
    op.drop_index('idx_listings_seller_id', table_name='listings')

    # Categories
    op.drop_index('idx_categories_parent_id', table_name='categories')

    # Users
    op.drop_index('idx_users_is_active', table_name='users')
    op.drop_index('idx_users_role', table_name='users')
