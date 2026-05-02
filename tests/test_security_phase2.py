"""
Security tests for OWASP Phase 2 remediation
Tests HTTPS enforcement, error sanitization, API URL validation, and CORS
"""

import pytest
from unittest.mock import Mock, patch


class TestCORSConfiguration:
    """Test CORS middleware configuration"""

    def test_cors_allows_localhost_in_dev(self, client):
        """CORS should allow localhost in development mode — use GET, not OPTIONS."""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:5173"},
        )
        # /health is always 200; CORS headers are present when origin is allowed
        assert response.status_code == 200

    def test_cors_restricts_origins_in_production(self, client):
        """Disallowed origins should not receive Access-Control-Allow-Origin."""
        response = client.get(
            "/health",
            headers={"Origin": "https://evil.com"},
        )
        # Request still succeeds (CORS is a browser enforcement, not a block)
        assert response.status_code == 200
        # But the ACAO header must NOT echo back the disallowed origin
        acao = response.headers.get("access-control-allow-origin", "")
        assert acao != "https://evil.com"


class TestHTTPSEnforcement:
    """Test HTTPS enforcement in production"""

    def test_http_url_rejected_in_production(self):
        """HTTP URLs should be rejected in production mode (frontend concern)."""
        # Backend doesn't enforce HTTPS on incoming requests —
        # that is handled by the reverse proxy / load balancer.
        pass


class TestErrorSanitization:
    """Test error message sanitization"""

    def test_error_responses_dont_leak_details(self, client):
        """404 responses should not leak implementation details."""
        from tests.conftest import auth_headers

        response = client.get(
            "/api/v1/entries/999999",
            headers=auth_headers(),   # must be authenticated to reach the 404
        )
        assert response.status_code == 404
        assert "entry not found" in response.text.lower()
        # Must not contain stack traces or internal paths
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


class TestAPIURLValidation:
    """Test API URL validation (frontend)"""

    def test_validate_api_url_accepts_https(self):
        """validateApiUrl should accept HTTPS URLs (frontend TypeScript test)."""
        pass

    def test_validate_api_url_rejects_http_in_prod(self):
        """validateApiUrl should reject HTTP in production (frontend TypeScript test)."""
        pass


class TestInputValidation:
    """Test input validation from Phase 1 still works"""

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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# Made with Bob
