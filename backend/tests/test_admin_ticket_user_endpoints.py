"""
Test Admin Ticket and User Management Endpoints
Tests for:
- PUT /api/admin/tickets/{ticket_id}/status - Update ticket status
- PUT /api/admin/tickets/{ticket_id}/reply - Reply to ticket
- PUT /api/admin/tickets/{ticket_id}/close - Close ticket
- DELETE /api/admin/tickets/{ticket_id} - Delete ticket
- PUT /api/admin/users/{user_id} - Update user subscription
- GET /api/admin/users - List all users
- GET /api/admin/tickets - List all tickets
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://sepulang-admin-fix.preview.emergentagent.com')

class TestAdminEndpointsExist:
    """Test that admin endpoints exist and require authentication"""
    
    def test_health_check(self):
        """Health endpoint should work without auth"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_admin_users_requires_auth(self):
        """GET /api/admin/users should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401
        print("✓ GET /api/admin/users returns 401 without auth")
    
    def test_admin_tickets_requires_auth(self):
        """GET /api/admin/tickets should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code == 401
        print("✓ GET /api/admin/tickets returns 401 without auth")
    
    def test_ticket_status_update_requires_auth(self):
        """PUT /api/admin/tickets/{id}/status should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/tickets/test-ticket-id/status",
            json={"status": "OPEN"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/tickets/{id}/status returns 401 without auth")
    
    def test_ticket_reply_requires_auth(self):
        """PUT /api/admin/tickets/{id}/reply should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/tickets/test-ticket-id/reply",
            json={"balasan_admin": "Test reply"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/tickets/{id}/reply returns 401 without auth")
    
    def test_ticket_close_requires_auth(self):
        """PUT /api/admin/tickets/{id}/close should return 401 without auth"""
        response = requests.put(f"{BASE_URL}/api/admin/tickets/test-ticket-id/close")
        assert response.status_code == 401
        print("✓ PUT /api/admin/tickets/{id}/close returns 401 without auth")
    
    def test_ticket_delete_requires_auth(self):
        """DELETE /api/admin/tickets/{id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/tickets/test-ticket-id")
        assert response.status_code == 401
        print("✓ DELETE /api/admin/tickets/{id} returns 401 without auth")
    
    def test_user_update_requires_auth(self):
        """PUT /api/admin/users/{id} should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/test-user-id",
            json={"status_langganan": "ACTIVE"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/users/{id} returns 401 without auth")


class TestAdminWithDemoLogin:
    """Test admin endpoints with demo admin login"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with demo admin login"""
        self.session = requests.Session()
        # Login as demo admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "admin@demo.com", "password": "password"}
        )
        if login_response.status_code == 200:
            self.logged_in = True
            print("✓ Demo admin login successful")
        else:
            self.logged_in = False
            print(f"⚠ Demo admin login failed: {login_response.status_code}")
    
    def test_get_admin_users(self):
        """GET /api/admin/users should return list of users for admin"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify user structure
        user = data[0]
        assert "user_id" in user
        assert "email" in user
        print(f"✓ GET /api/admin/users returned {len(data)} users")
    
    def test_get_admin_tickets(self):
        """GET /api/admin/tickets should return list of tickets for admin"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/tickets returned {len(data)} tickets")
    
    def test_update_ticket_status_open(self):
        """PUT /api/admin/tickets/{id}/status should update status to OPEN"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        # First get a ticket
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status",
            json={"status": "OPEN"}
        )
        assert response.status_code == 200
        data = response.json()
        # Status should be OPEN (normalized)
        assert data.get("status") in ["OPEN", "Open"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/status to OPEN successful")
    
    def test_update_ticket_status_in_progress(self):
        """PUT /api/admin/tickets/{id}/status should update status to IN_PROGRESS"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status",
            json={"status": "IN_PROGRESS"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["IN_PROGRESS", "InProgress"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/status to IN_PROGRESS successful")
    
    def test_update_ticket_status_resolved(self):
        """PUT /api/admin/tickets/{id}/status should update status to RESOLVED"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status",
            json={"status": "RESOLVED"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["RESOLVED", "Resolved", "Answered"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/status to RESOLVED successful")
    
    def test_update_ticket_status_closed(self):
        """PUT /api/admin/tickets/{id}/status should update status to CLOSED"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status",
            json={"status": "CLOSED"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["CLOSED", "Closed"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/status to CLOSED successful")
    
    def test_update_ticket_status_invalid(self):
        """PUT /api/admin/tickets/{id}/status should reject invalid status"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status",
            json={"status": "INVALID_STATUS"}
        )
        assert response.status_code == 400
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/status rejects invalid status")
    
    def test_reply_to_ticket(self):
        """PUT /api/admin/tickets/{id}/reply should add reply and set status to RESOLVED"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/reply",
            json={"balasan_admin": "Test reply from admin - automated test"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("balasan_admin") == "Test reply from admin - automated test"
        # Reply should set status to RESOLVED
        assert data.get("status") in ["RESOLVED", "Resolved", "Answered"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/reply successful")
    
    def test_close_ticket(self):
        """PUT /api/admin/tickets/{id}/close should set status to CLOSED"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        tickets_response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        if tickets_response.status_code != 200 or not tickets_response.json():
            pytest.skip("No tickets available")
        
        ticket = tickets_response.json()[0]
        ticket_id = ticket["ticket_id"]
        
        response = self.session.put(f"{BASE_URL}/api/admin/tickets/{ticket_id}/close")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["CLOSED", "Closed"]
        print(f"✓ PUT /api/admin/tickets/{ticket_id}/close successful")
    
    def test_update_user_subscription_status(self):
        """PUT /api/admin/users/{id} should update subscription status"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        # Get a user to update
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        if users_response.status_code != 200 or not users_response.json():
            pytest.skip("No users available")
        
        # Find a non-admin user to update
        users = users_response.json()
        test_user = None
        for u in users:
            if u.get("role") != "ADMIN" and u.get("email") != "admin@demo.com":
                test_user = u
                break
        
        if not test_user:
            pytest.skip("No non-admin user available for testing")
        
        user_id = test_user["user_id"]
        original_status = test_user.get("status_langganan", "TRIAL")
        
        # Update to ACTIVE
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={"status_langganan": "ACTIVE"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status_langganan") == "ACTIVE"
        print(f"✓ PUT /api/admin/users/{user_id} updated status to ACTIVE")
        
        # Restore original status
        self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={"status_langganan": original_status}
        )
    
    def test_update_user_berlaku_sampai(self):
        """PUT /api/admin/users/{id} should update berlaku_sampai date"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        if users_response.status_code != 200 or not users_response.json():
            pytest.skip("No users available")
        
        users = users_response.json()
        test_user = None
        for u in users:
            if u.get("role") != "ADMIN" and u.get("email") != "admin@demo.com":
                test_user = u
                break
        
        if not test_user:
            pytest.skip("No non-admin user available for testing")
        
        user_id = test_user["user_id"]
        new_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={"berlaku_sampai": new_date}
        )
        assert response.status_code == 200
        data = response.json()
        assert "berlaku_sampai" in data
        print(f"✓ PUT /api/admin/users/{user_id} updated berlaku_sampai")
    
    def test_update_user_subscription_and_date(self):
        """PUT /api/admin/users/{id} should update both status and date"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        if users_response.status_code != 200 or not users_response.json():
            pytest.skip("No users available")
        
        users = users_response.json()
        test_user = None
        for u in users:
            if u.get("role") != "ADMIN" and u.get("email") != "admin@demo.com":
                test_user = u
                break
        
        if not test_user:
            pytest.skip("No non-admin user available for testing")
        
        user_id = test_user["user_id"]
        new_date = (datetime.now() + timedelta(days=60)).isoformat()
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={
                "status_langganan": "TRIAL",
                "berlaku_sampai": new_date
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status_langganan") == "TRIAL"
        assert "berlaku_sampai" in data
        print(f"✓ PUT /api/admin/users/{user_id} updated both status and date")


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with demo user (non-admin) login"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"}
        )
        if login_response.status_code == 200:
            self.logged_in = True
            print("✓ Demo user login successful")
        else:
            self.logged_in = False
            print(f"⚠ Demo user login failed: {login_response.status_code}")
    
    def test_non_admin_cannot_get_users(self):
        """Non-admin should get 403 on GET /api/admin/users"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 403
        print("✓ Non-admin gets 403 on GET /api/admin/users")
    
    def test_non_admin_cannot_get_tickets(self):
        """Non-admin should get 403 on GET /api/admin/tickets"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code == 403
        print("✓ Non-admin gets 403 on GET /api/admin/tickets")
    
    def test_non_admin_cannot_update_ticket_status(self):
        """Non-admin should get 403 on PUT /api/admin/tickets/{id}/status"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/tickets/test-id/status",
            json={"status": "OPEN"}
        )
        assert response.status_code == 403
        print("✓ Non-admin gets 403 on PUT /api/admin/tickets/{id}/status")
    
    def test_non_admin_cannot_update_user(self):
        """Non-admin should get 403 on PUT /api/admin/users/{id}"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/test-id",
            json={"status_langganan": "ACTIVE"}
        )
        assert response.status_code == 403
        print("✓ Non-admin gets 403 on PUT /api/admin/users/{id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
