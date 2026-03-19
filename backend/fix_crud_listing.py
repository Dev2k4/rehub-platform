with open("app/crud/crud_listing.py", "r") as f:
    text = f.read()

text = text.replace("from sqlalchemy import delete\n", "")
text = text.replace("from sqlalchemy import func, update, or_", "from sqlalchemy import func, update, or_, delete")

with open("app/crud/crud_listing.py", "w") as f:
    f.write(text)
