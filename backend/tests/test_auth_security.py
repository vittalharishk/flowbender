"""F8 backend security and RBAC tests. Runs against the live API at localhost:8000.

Usage: python -m pytest tests/test_auth_security.py -v
"""
import httpx
import pytest

BASE = "http://localhost:8000/api/v1"

OWNER = {"email": "producer@flowbender.demo", "password": "Demo1234"}
ADMIN = {"email": "admin@flowbender.demo", "password": "Demo1234"}
MANAGER = {"email": "ep@flowbender.demo", "password": "Demo1234"}


def login(creds):
    r = httpx.post(f"{BASE}/auth/login", json=creds)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.text}"
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    r = httpx.get(f"{BASE}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def test_login_valid():
    token = login(OWNER)
    assert token


def test_login_wrong_password():
    r = httpx.post(f"{BASE}/auth/login", json={"email": OWNER["email"], "password": "WrongPass999"})
    assert r.status_code == 401


def test_login_nonexistent_email():
    r = httpx.post(f"{BASE}/auth/login", json={"email": "nobody@example.com", "password": "Whatever123"})
    assert r.status_code == 401


def test_login_empty_body():
    r = httpx.post(f"{BASE}/auth/login", json={})
    assert r.status_code == 422


def test_me_requires_auth():
    r = httpx.get(f"{BASE}/auth/me")
    assert r.status_code in (401, 403)


def test_me_with_token():
    token = login(OWNER)
    r = httpx.get(f"{BASE}/auth/me", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == OWNER["email"]


def test_me_never_exposes_password_hash():
    token = login(OWNER)
    r = httpx.get(f"{BASE}/auth/me", headers=auth_headers(token))
    text = r.text.lower()
    assert "password_hash" not in text
    assert "$2b$" not in r.text  # bcrypt prefix


def test_invalid_token_rejected():
    r = httpx.get(f"{BASE}/auth/me", headers=auth_headers("invalid.token.here"))
    assert r.status_code in (401, 403)


def test_refresh_flow():
    r = httpx.post(f"{BASE}/auth/login", json=OWNER)
    refresh = r.json()["refresh_token"]
    r2 = httpx.post(f"{BASE}/auth/refresh", json={"refresh_token": refresh})
    assert r2.status_code == 200
    assert r2.json()["access_token"]


def test_refresh_with_access_token_rejected():
    token = login(OWNER)
    r = httpx.post(f"{BASE}/auth/refresh", json={"refresh_token": token})
    assert r.status_code == 401


def test_change_password_requires_current():
    token = login(OWNER)
    r = httpx.post(
        f"{BASE}/auth/change-password",
        json={"current_password": "WrongCurrent1", "new_password": "NewSecret123"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400


def test_register_weak_password_rejected():
    r = httpx.post(f"{BASE}/auth/register", json={
        "org_name": "Weak Test Org", "email": "weak@test.example",
        "password": "123", "first_name": "Weak",
    })
    assert r.status_code == 400


def test_bootstrap_rejected_when_users_exist():
    r = httpx.post(f"{BASE}/auth/bootstrap", json={
        "org_name": "Evil Org", "email": "evil@test.example",
        "password": "Evil12345", "first_name": "Evil",
    })
    assert r.status_code == 409


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------

def test_owner_can_list_users():
    token = login(OWNER)
    r = httpx.get(f"{BASE}/users/", headers=auth_headers(token))
    assert r.status_code == 200


def test_manager_cannot_create_users():
    token = login(MANAGER)
    r = httpx.post(f"{BASE}/users/", json={
        "email": "sneaky@test.example", "password": "Sneaky123",
        "first_name": "Sneak", "role": "admin",
    }, headers=auth_headers(token))
    assert r.status_code == 403


def test_unauthenticated_cannot_list_users():
    r = httpx.get(f"{BASE}/users/")
    assert r.status_code in (401, 403)


def test_owner_can_read_audit_logs():
    token = login(OWNER)
    r = httpx.get(f"{BASE}/settings/audit-logs", headers=auth_headers(token))
    assert r.status_code == 200


def test_manager_cannot_read_audit_logs():
    token = login(MANAGER)
    r = httpx.get(f"{BASE}/settings/audit-logs", headers=auth_headers(token))
    assert r.status_code == 403


def test_users_list_never_exposes_hashes():
    token = login(OWNER)
    r = httpx.get(f"{BASE}/users/", headers=auth_headers(token))
    assert "password_hash" not in r.text
    assert "$2b$" not in r.text
