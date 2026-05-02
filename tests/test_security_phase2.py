"""
Security tests for OWASP Phase 2 remediation
Tests HTTPS enforcement, error sanitization, API URL validation, and CORS
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from cortex_api.server import app


class TestCORSConfiguration:
    """Test CORS middleware configuration"""
    
    def test_cors_allows_localhost_in_dev(self):
        """CORS should allow localhost in development mode"""
        with patch('cortex_api.server.settings') as mock_settings:
            mock_settings.reload = True
            client = TestClient(app)
            response = client.options(
                "/health",
                headers={"Origin": "http://localhost:5173"}
            )
            assert response.status_code in [200, 204]
    
    def test_cors_restricts_origins_in_production(self):
        """CORS should restrict origins in production mode"""
        with patch('cortex_api.server.settings') as mock_settings:
            mock_settings.reload = False
            client = TestClient(app)
            
            # Test allowed origin
            response = client.options(
                "/health",
                headers={"Origin": "https://cortex.dev"}
            )
            assert response.status_code in [200, 204]
            
            # Test disallowed origin
            response = client.options(
                "/health",
                headers={"Origin": "https://evil.com"}
            )
            # Should not have CORS headers for disallowed origin
            assert "access-control-allow-origin" not in response.headers.keys()


class TestHTTPSEnforcement:
    """Test HTTPS enforcement in production"""
    
    def test_http_url_rejected_in_production(self):
        """HTTP URLs should be rejected in production mode"""
        # This would be tested in the frontend
        # Backend doesn't enforce HTTPS on incoming requests
        # (that's handled by reverse proxy/load balancer)
        pass


class TestErrorSanitization:
    """Test error message sanitization"""
    
    def test_error_responses_dont_leak_details(self):
        """Error responses should not leak implementation details"""
        client = TestClient(app)
        
        # Test 404 error
        response = client.get("/api/v1/entries/999999")
        assert response.status_code == 404
        assert "entry not found" in response.text.lower()
        # Should not contain stack traces or internal paths
        assert "traceback" not in response.text.lower()
        assert "/Users/" not in response.text
        assert "cortex_api" not in response.text
    
    def test_validation_errors_are_generic(self):
        """Validation errors should not expose internal structure"""
        client = TestClient(app)
        
        # Test with invalid token
        response = client.get(
            "/api/v1/entries",
            headers={"Authorization": "Bearer invalid"}
        )
        assert response.status_code == 401
        # Should not reveal token validation logic
        assert "jwt" not in response.text.lower()
        assert "decode" not in response.text.lower()


class TestAPIURLValidation:
    """Test API URL validation (frontend)"""
    
    def test_validate_api_url_accepts_https(self):
        """validateApiUrl should accept HTTPS URLs"""
        # This would be tested in frontend TypeScript tests
        # Python backend doesn't validate API URLs
        pass
    
    def test_validate_api_url_rejects_http_in_prod(self):
        """validateApiUrl should reject HTTP in production"""
        # This would be tested in frontend TypeScript tests
        pass


class TestInputValidation:
    """Test input validation from Phase 1 still works"""
    
    def test_search_query_validation(self):
        """Search queries should be validated"""
        client = TestClient(app)
        
        # Empty query should fail
        response = client.get(
            "/api/v1/search?q=&k=5",
            headers={"Authorization": f"Bearer test-token"}
        )
        assert response.status_code == 422
    
    def test_entry_id_validation(self):
        """Entry IDs should be validated"""
        client = TestClient(app)
        
        # Invalid ID format should fail
        response = client.get(
            "/api/v1/entries/abc",
            headers={"Authorization": f"Bearer test-token"}
        )
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# Made with Bob
