import re

with open("tests/test_auth.py", "r") as f:
    code = f.read()

# Just use the raw http call instead of raw db query because we only need to test the result. If we really need DB call, we could use api call again.
# We will use /users/me test right here.

code = code.replace("""    # Check db
    user = await get_user_by_email(db, "test@example.com")
    assert user is not None
    assert user.full_name == "Test User\"""", """    # Check me API
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_response = await client.get("/api/v1/users/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com\"""")

with open("tests/test_auth.py", "w") as f:
    f.write(code)

