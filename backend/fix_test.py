with open('tests/test_orders.py', 'r') as f:
    text = f.read()

text = text.replace('    from sqlalchemy import update\n    await db.execute(update(Listing).where(Listing.id == listing_id).values(status=ListingStatus.ACTIVE))\n    await db.commit()', '    await client.post(f"/api/v1/admin/listings/{listing_id}/approve")')

with open('tests/test_orders.py', 'w') as f:
    f.write(text)
