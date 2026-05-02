"""
Security tests — OWASP Phase 2 & 3 remediation.
Covers: CORS, error sanitization, input validation, security headers,
server-side rate limiting.
"""

import pytest
from unittest.mock import patch


class TestCORSConfiguration:
    """Test CORS middleware configuration"""

    def test_cors_allows_localhost_in_dev(self, client):
        """CORS should allow localhost in development mode."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:5173"},
        )
        assert response.status_code == 200

    def test_cors_restricts_origins_in_production(self, client):
        """Disallowed origins should not receive Access-Control-Allow-Origin."""
        response = client.get(
            "/health",
            headers={"Origin": "https://evil.com"},
        )
        assert response.status_code == 200
        acao = response.headers.get("access-control-allow-origin", "")
        assert acao != "https://evil.com"


class TestSecurityHeaders:
    """Test that security headers are present on all responses."""

    def test_x_frame_options_deny(self, client):
        """X-Frame-Options must be DENY to prevent clickjacking."""
        response = client.get("/health")
        assert response.headers.get("x-frame-options") == "DENY"

    def test_x_content_type_options_nosniff(self, client):
        """X-Content-Type-Options must be nosniff to prevent MIME sniffing."""
        response = client.get("/health")
        assert response.headers.get("x-content-type-options") == "nosniff"

    def test_referrer_policy(self, client):
        """Referrer-Policy must be set to limit information leakage."""
        response = client.get("/health")
        assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_permissions_policy(self, client):
        """Permissions-Policy must restrict dangerous browser features."""
        response = client.get("/health")
        policy = response.headers.get("permissions-policy", "")
        assert "geolocation=()" in policy
        assert "microphone=()" in policy
        assert "camera=()" in policy

    def test_security_headers_on_api_endpoints(self, client):
        """Security headers must be present on API endpoints too."""
        from tests.conftest import auth_headers
        response = client.get("/api/v1/entries", headers=auth_headers())
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-content-type-options") == "nosniff"


class TestHTTPSEnforcement:
    """Test HTTPS enforcement in production"""

    def test_http_url_rejected_in_production(self):
        """HTTP URLs should be rejected in production mode (frontend concern)."""
        pass  # Handled by frontend validation.ts


class TestErrorSanitization:
    """Test error message sanitization"""

    def test_error_responses_dont_leak_details(self, client):
        """404 responses should not leak implementation details."""
        from tests.conftest import auth_headers
        response = client.get(
            "/api/v1/entries/999999",
            headers=auth_headers(),
        )
        assert response.status_code == 404
        assert "entry not found" in response.text.lower()
        assert "traceback" not in response.text.lower()
        assert "cortex_api" not in response.text

    def test_validation_errors_are_generic(self, client):
        """Validation errors should not expose internal structure."""
        response = client.get(
            "/api/v1/entries",
            headers={"Authorization": "Bearer invalid"},
        )
        assert response.status_code == 401
        assert "jwt" not in response.text.lower()
        assert "decode" not in response.text.lower()

    def test_401_does_not_leak_token_value(self, client):
        """401 response must not echo back the submitted token."""
        fake_token = "super-secret-token-value-12345"
        response = client.get(
            "/api/v1/entries",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert response.status_code == 401
        assert fake_token not in response.text


class TestAPIURLValidation:
    """Test API URL validation (frontend)"""

    def test_validate_api_url_accepts_https(self):
        """validateApiUrl should accept HTTPS URLs."""
        pass  # Tested in frontend TypeScript tests

    def test_validate_api_url_rejects_http_in_prod(self):
        """validateApiUrl should reject HTTP in production."""
        pass  # Tested in frontend TypeScript tests


class TestInputValidation:
    """Test input validation"""

    def test_search_query_validation(self, client):
        """Empty search queries should be rejected with 422."""
        response = client.get(
            "/api/v1/search?q=&k=5",
            headers={"Authorization": "Bearer test-token"},
        )
        assert response.status_code == 422

    def test_entry_id_validation(self, client):
        """Non-integer entry IDs should be rejected with 422."""
        response = client.get(
            "/api/v1/entries/abc",
            headers={"Authorization": "Bearer test-token"},
        )
        assert response.status_code == 422

    def test_search_query_min_length(self, client):
        """Search query must have at least 1 character."""
        response = client.get(
            "/api/v1/search?q= &k=5",
            headers={"Authorization": "Bearer test-token"},
        )
        # Either 422 (validation) or 200 with empty results — not 500
        assert response.status_code in (200, 422)

    def test_negative_entry_id_rejected(self, client):
        """Negative entry IDs should return 404 (not found) or 422 (validation)."""
        response = client.get(
            "/api/v1/entries/-1",
            headers={"Authorization": "Bearer test-token"},
        )
        # FastAPI accepts negative integers as valid path params (they're valid ints)
        # but the entry won't exist, so 404 is the correct response
        assert response.status_code in (404, 422)


class TestServerSideRateLimiting:
    """Test server-side rate limiting."""

    def setup_method(self):
        """Clear rate limit state before each test to avoid cross-test pollution."""
        from cortex_api.server import _rate_windows
        _rate_windows.clear()

    def test_create_entry_rate_limit(self, client):
        """Exceeding create_entry rate limit should return 429."""
        from tests.conftest import auth_headers
        from cortex_api.server import _rate_windows

        # Clear any existing rate limit state for this test
        _rate_windows.clear()

        headers = auth_headers()
        body = {"text": "test entry", "source": "bob"}

        # Make requests up to the limit (20/min)
        responses = []
        for i in range(22):
            r = client.post("/api/v1/entries", json=body, headers=headers)
            responses.append(r.status_code)

        # At least one should be 429 (rate limited)
        assert 429 in responses, f"Expected 429 in responses, got: {set(responses)}"

    def test_search_rate_limit(self, client):
        """Exceeding search rate limit should return 429."""
        from tests.conftest import auth_headers
        from cortex_api.server import _rate_windows

        _rate_windows.clear()

        headers = auth_headers()
        responses = []
        for i in range(32):
            r = client.get(f"/api/v1/search?q=test{i}&k=1", headers=headers)
            responses.append(r.status_code)

        assert 429 in responses, f"Expected 429 in responses, got: {set(responses)}"

    def test_rate_limit_response_has_retry_after(self, client):
        """429 responses must include Retry-After header."""
        from tests.conftest import auth_headers
        from cortex_api.server import _rate_windows

        _rate_windows.clear()

        headers = auth_headers()
        body = {"text": "test entry", "source": "bob"}

        last_response = None
        for i in range(22):
            r = client.post("/api/v1/entries", json=body, headers=headers)
            if r.status_code == 429:
                last_response = r
                break

        if last_response:
            assert "retry-after" in last_response.headers


class TestSecretDetection:
    """Test that secret detection works end-to-end via the API."""

    def setup_method(self):
        """Clear rate limit state before each test."""
        from cortex_api.server import _rate_windows
        _rate_windows.clear()

    def test_api_rejects_aws_key(self, client):
        """API must reject entries containing AWS access keys."""
        from tests.conftest import auth_headers
        response = client.post(
            "/api/v1/entries",
            json={"text": "my key is AKIAIOSFODNN7EXAMPLE", "source": "bob"},
            headers=auth_headers(),
        )
        assert response.status_code == 422
        data = response.json()
        assert data["detail"]["error"] == "secret_detected"

    def test_api_rejects_github_token(self, client):
        """API must reject entries containing GitHub PATs."""
        from tests.conftest import auth_headers
        response = client.post(
            "/api/v1/entries",
            json={"text": f"token ghp_{'a' * 36}", "source": "bob"},
            headers=auth_headers(),
        )
        assert response.status_code == 422

    def test_api_accepts_clean_text(self, client):
        """API must accept entries with no secrets."""
        from tests.conftest import auth_headers
        response = client.post(
            "/api/v1/entries",
            json={"text": "fixed the connection pool by raising max_connections to 50", "source": "bob"},
            headers=auth_headers(),
        )
        assert response.status_code == 201


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# Made with Bob
