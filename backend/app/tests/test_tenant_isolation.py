import uuid
import pytest
from app.auth.utils import create_access_token


class TestTenantIsolation:
    def test_different_orgs_get_different_tokens(self):
        org1 = uuid.uuid4()
        org2 = uuid.uuid4()
        user = uuid.uuid4()

        token1 = create_access_token(user, org1, "admin")
        token2 = create_access_token(user, org2, "admin")

        assert token1 != token2

    def test_token_contains_org_id(self):
        from app.auth.utils import decode_token

        org_id = uuid.uuid4()
        user_id = uuid.uuid4()
        token = create_access_token(user_id, org_id, "staff")
        payload = decode_token(token)
        assert payload["org"] == str(org_id)


class TestRoleAccess:
    def test_role_in_token(self):
        from app.auth.utils import decode_token

        uid = uuid.uuid4()
        oid = uuid.uuid4()
        for role in ["owner", "admin", "manager", "accountant", "staff", "viewer"]:
            token = create_access_token(uid, oid, role)
            payload = decode_token(token)
            assert payload["role"] == role
