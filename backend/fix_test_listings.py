import re

with open("tests/test_listings.py", "r") as f:
    code = f.read()

code = code.replace("""json={"email": email, "password": "Password123!"}""", """data={"username": email, "password": "Password123!"}""")

with open("tests/test_listings.py", "w") as f:
    f.write(code)

with open("tests/test_auth.py", "r") as f:
    code = f.read()

code = code.replace("""json={
            "email": "login@example.com",
            "password": "Password123!"
        }""", """data={
            "username": "login@example.com",
            "password": "Password123!"
        }""")

code = code.replace("""json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }""", """data={
            "username": "wrong@example.com",
            "password": "wrongpassword"
        }""")

with open("tests/test_auth.py", "w") as f:
    f.write(code)

