import pytest
from app.auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_password_strength,
)
import uuid


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "SecurePass123"
        hashed = hash_password(password)
        assert verify_password(password, hashed)
        assert not verify_password("WrongPass", hashed)

    def test_different_hashes(self):
        p = "SecurePass123"
        h1 = hash_password(p)
        h2 = hash_password(p)
        assert h1 != h2


class TestPasswordValidation:
    def test_valid_password(self):
        assert validate_password_strength("SecurePass1") is None

    def test_too_short(self):
        result = validate_password_strength("Ab1")
        assert result is not None

    def test_no_uppercase(self):
        result = validate_password_strength("lowercase1")
        assert result is not None

    def test_no_lowercase(self):
        result = validate_password_strength("UPPERCASE1")
        assert result is not None

    def test_no_digit(self):
        result = validate_password_strength("NoDigitHere")
        assert result is not None


class TestJWTTokens:
    def test_access_token_roundtrip(self):
        uid = uuid.uuid4()
        oid = uuid.uuid4()
        token = create_access_token(uid, oid, "admin")
        payload = decode_token(token)
        assert payload["sub"] == str(uid)
        assert payload["org"] == str(oid)
        assert payload["role"] == "admin"
        assert payload["type"] == "access"

    def test_refresh_token_roundtrip(self):
        uid = uuid.uuid4()
        sid = uuid.uuid4()
        token = create_refresh_token(uid, sid)
        payload = decode_token(token)
        assert payload["sub"] == str(uid)
        assert payload["session"] == str(sid)
        assert payload["type"] == "refresh"

    def test_invalid_token(self):
        payload = decode_token("invalid.token.here")
        assert payload == {}
