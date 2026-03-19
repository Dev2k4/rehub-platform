import re
with open('app/api/v1/admin.py', 'r') as f:
    content = f.read()

imports = """
from app.crud.crud_listing import get_listing, get_pending_listings
from app.models.enums import ListingStatus
from app.schemas.listing import ListingRead
"""

content = content.replace(imports, "")
content = content.replace("from app.schemas.user import UserMe, UserStatusUpdate\n", "from app.schemas.user import UserMe, UserStatusUpdate\n" + imports)

with open('app/api/v1/admin.py', 'w') as f:
    f.write(content)
