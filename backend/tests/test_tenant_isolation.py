"""
Test Tenant Isolation and Authentication Security
This module tests that:
1. All /api/ endpoints return 401 when no auth cookie is present
2. Demo user and demo admin login work correctly
3. GET endpoints return ONLY data belonging to the authenticated user
4. POST endpoints create data with authenticated user's ID
5. PUT/DELETE endpoints only allow users to modify their OWN data
6. Admin routes return 403 for non-admin users and 200 for admin users
7. Data isolation between different users
"""

import pytest
import requests
import os
from datetime import datetime
import uuid

# Base URL from environment - use the external URL which routes through K8s ingress to FastAPI
BASE_URL = "https://sepulang-admin-fix.preview.emergentagent.com"


class TestAuthenticationRequired:
    """Test that ALL API endpoints require authentication (return 401 without cookies)"""
    
    def test_logbooks_requires_auth(self):
        """GET /api/logbooks returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/logbooks", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/logbooks returns 401 without auth")
    
    def test_patients_requires_auth(self):
        """GET /api/patients returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/patients", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/patients returns 401 without auth")
    
    def test_tickets_requires_auth(self):
        """GET /api/tickets returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/tickets", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/tickets returns 401 without auth")
    
    def test_auth_me_requires_auth(self):
        """GET /api/auth/me returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/auth/me returns 401 without auth")
    
    def test_admin_users_requires_auth(self):
        """GET /api/admin/users returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/admin/users returns 401 without auth")
    
    def test_admin_tickets_requires_auth(self):
        """GET /api/admin/tickets returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/tickets", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: GET /api/admin/tickets returns 401 without auth")


class TestDemoLogin:
    """Test demo login functionality"""
    
    def test_demo_user_login(self):
        """Demo user login returns 200 with session cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user" in data, "Response should contain 'user'"
        assert "session_token" in data, "Response should contain 'session_token'"
        assert data["user"]["email"] == "user@demo.com", "User email should match"
        assert data["user"]["role"] == "USER", "Demo user should have USER role"
        
        # Verify session cookie was set
        cookies = session.cookies.get_dict()
        assert "session_token" in cookies, "session_token cookie should be set"
        print("PASS: Demo user login works correctly")
    
    def test_demo_admin_login(self):
        """Demo admin login returns 200 with session cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "admin@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user" in data, "Response should contain 'user'"
        assert "session_token" in data, "Response should contain 'session_token'"
        assert data["user"]["email"] == "admin@demo.com", "Admin email should match"
        assert data["user"]["role"] == "ADMIN", "Demo admin should have ADMIN role"
        
        # Verify session cookie was set
        cookies = session.cookies.get_dict()
        assert "session_token" in cookies, "session_token cookie should be set"
        print("PASS: Demo admin login works correctly")
    
    def test_invalid_demo_login(self):
        """Invalid demo credentials return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "wrongpassword"},
            timeout=30
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Invalid demo credentials return 401")


class TestAdminRoleAccess:
    """Test admin-only routes return 403 for non-admin users and 200 for admin users"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated demo user session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def admin_session(self):
        """Create authenticated demo admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "admin@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        return session
    
    def test_admin_users_returns_403_for_user(self, user_session):
        """GET /api/admin/users returns 403 for non-admin user"""
        response = user_session.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: GET /api/admin/users returns 403 for non-admin user")
    
    def test_admin_tickets_returns_403_for_user(self, user_session):
        """GET /api/admin/tickets returns 403 for non-admin user"""
        response = user_session.get(f"{BASE_URL}/api/admin/tickets", timeout=30)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: GET /api/admin/tickets returns 403 for non-admin user")
    
    def test_admin_stats_returns_403_for_user(self, user_session):
        """GET /api/admin/stats returns 403 for non-admin user"""
        response = user_session.get(f"{BASE_URL}/api/admin/stats", timeout=30)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: GET /api/admin/stats returns 403 for non-admin user")
    
    def test_admin_users_returns_200_for_admin(self, admin_session):
        """GET /api/admin/users returns 200 for admin user"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of users"
        print("PASS: GET /api/admin/users returns 200 for admin user")
    
    def test_admin_tickets_returns_200_for_admin(self, admin_session):
        """GET /api/admin/tickets returns 200 for admin user"""
        response = admin_session.get(f"{BASE_URL}/api/admin/tickets", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of tickets"
        print("PASS: GET /api/admin/tickets returns 200 for admin user")
    
    def test_admin_stats_returns_200_for_admin(self, admin_session):
        """GET /api/admin/stats returns 200 for admin user"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_users" in data, "Response should contain total_users"
        print("PASS: GET /api/admin/stats returns 200 for admin user")


class TestDataIsolation:
    """Test data isolation between users - each user sees only their own data"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated demo user session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        # Store user_id for verification
        session.user_id = response.json()["user"]["user_id"]
        return session
    
    @pytest.fixture
    def admin_session(self):
        """Create authenticated demo admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "admin@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        # Store user_id for verification
        session.user_id = response.json()["user"]["user_id"]
        return session
    
    def test_logbooks_returns_only_user_data(self, user_session):
        """GET /api/logbooks returns ONLY logbooks with authenticated user's user_id"""
        response = user_session.get(f"{BASE_URL}/api/logbooks", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        logbooks = response.json()
        
        # All logbooks should belong to the logged-in user
        for logbook in logbooks:
            assert logbook.get("user_id") == user_session.user_id, \
                f"Logbook user_id {logbook.get('user_id')} should match session user_id {user_session.user_id}"
        
        print(f"PASS: GET /api/logbooks returns {len(logbooks)} logbooks, all belong to user {user_session.user_id}")
    
    def test_patients_returns_only_user_data(self, user_session):
        """GET /api/patients returns ONLY patients with authenticated user's user_id"""
        response = user_session.get(f"{BASE_URL}/api/patients", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        patients = response.json()
        
        # All patients should belong to the logged-in user
        for patient in patients:
            assert patient.get("user_id") == user_session.user_id, \
                f"Patient user_id {patient.get('user_id')} should match session user_id {user_session.user_id}"
        
        print(f"PASS: GET /api/patients returns {len(patients)} patients, all belong to user {user_session.user_id}")
    
    def test_tickets_returns_only_user_data(self, user_session):
        """GET /api/tickets returns ONLY tickets with authenticated user's user_id"""
        response = user_session.get(f"{BASE_URL}/api/tickets", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        tickets = response.json()
        
        # All tickets should belong to the logged-in user
        for ticket in tickets:
            assert ticket.get("user_id") == user_session.user_id, \
                f"Ticket user_id {ticket.get('user_id')} should match session user_id {user_session.user_id}"
        
        print(f"PASS: GET /api/tickets returns {len(tickets)} tickets, all belong to user {user_session.user_id}")
    
    def test_user_and_admin_see_different_logbooks(self, user_session, admin_session):
        """Demo user and demo admin should see different (or empty) logbook sets"""
        user_response = user_session.get(f"{BASE_URL}/api/logbooks", timeout=30)
        admin_response = admin_session.get(f"{BASE_URL}/api/logbooks", timeout=30)
        
        assert user_response.status_code == 200
        assert admin_response.status_code == 200
        
        user_logbooks = user_response.json()
        admin_logbooks = admin_response.json()
        
        # Verify user_ids are different
        user_ids_in_user_data = set(l.get("user_id") for l in user_logbooks if l.get("user_id"))
        user_ids_in_admin_data = set(l.get("user_id") for l in admin_logbooks if l.get("user_id"))
        
        # Each user's data should only contain their own user_id
        if user_logbooks:
            assert all(uid == user_session.user_id for uid in user_ids_in_user_data), \
                "User logbooks should only contain user's own data"
        if admin_logbooks:
            assert all(uid == admin_session.user_id for uid in user_ids_in_admin_data), \
                "Admin logbooks should only contain admin's own data"
        
        print(f"PASS: User sees {len(user_logbooks)} logbooks (user_id: {user_session.user_id}), Admin sees {len(admin_logbooks)} logbooks (user_id: {admin_session.user_id})")


class TestCreateWithAuthenticatedUserId:
    """Test that POST endpoints create data with authenticated user's ID"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated demo user session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        session.user_id = response.json()["user"]["user_id"]
        session.user_email = response.json()["user"]["email"]
        session.user_name = response.json()["user"]["name"]
        return session
    
    def test_create_patient_uses_auth_user_id(self, user_session):
        """POST /api/patients creates patient with authenticated user's user_id (not hardcoded)"""
        unique_id = uuid.uuid4().hex[:8]
        patient_data = {
            "nama_pasien": f"TEST_Patient_{unique_id}",
            "no_rm": f"RM-TEST-{unique_id}",
            "diagnosa": "Test Diagnosa"
        }
        
        response = user_session.post(
            f"{BASE_URL}/api/patients",
            json=patient_data,
            timeout=30
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        created_patient = response.json()
        
        # Verify user_id matches authenticated user
        assert created_patient.get("user_id") == user_session.user_id, \
            f"Created patient user_id {created_patient.get('user_id')} should match session user_id {user_session.user_id}"
        assert created_patient.get("nama_pasien") == patient_data["nama_pasien"]
        
        print(f"PASS: POST /api/patients creates patient with user_id={user_session.user_id}")
        
        # Cleanup - delete the test patient
        patient_id = created_patient.get("patient_id")
        if patient_id:
            user_session.delete(f"{BASE_URL}/api/patients/{patient_id}", timeout=30)
    
    def test_create_ticket_uses_auth_user_info(self, user_session):
        """POST /api/tickets creates ticket with authenticated user's email and name from session"""
        unique_id = uuid.uuid4().hex[:8]
        ticket_data = {
            "kategori": "Teknis",
            "subjek": f"TEST_Ticket_{unique_id}",
            "pesan_user": "This is a test ticket message"
        }
        
        response = user_session.post(
            f"{BASE_URL}/api/tickets",
            json=ticket_data,
            timeout=30
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        created_ticket = response.json()
        
        # Verify user_id, user_email, and user_name match authenticated user
        assert created_ticket.get("user_id") == user_session.user_id, \
            f"Created ticket user_id {created_ticket.get('user_id')} should match session user_id {user_session.user_id}"
        assert created_ticket.get("user_email") == user_session.user_email, \
            f"Created ticket user_email should match session email"
        assert created_ticket.get("user_name") == user_session.user_name, \
            f"Created ticket user_name should match session name"
        
        print(f"PASS: POST /api/tickets creates ticket with user_id={user_session.user_id}, email={user_session.user_email}")
    
    def test_create_logbook_uses_auth_user_id(self, user_session):
        """POST /api/logbooks creates logbook with authenticated user's user_id"""
        unique_date = f"2099-12-{uuid.uuid4().hex[:2].zfill(2)[-2:]}"  # Random future date
        logbook_data = {
            "tanggal_dinas": unique_date,
            "shift": "PAGI",
            "jam_datang": "07:00",
            "jam_pulang": "14:00",
            "daftar_tindakan": []
        }
        
        response = user_session.post(
            f"{BASE_URL}/api/logbooks",
            json=logbook_data,
            timeout=30
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        created_logbook = response.json()
        
        # Verify user_id matches authenticated user
        assert created_logbook.get("user_id") == user_session.user_id, \
            f"Created logbook user_id {created_logbook.get('user_id')} should match session user_id {user_session.user_id}"
        
        print(f"PASS: POST /api/logbooks creates logbook with user_id={user_session.user_id}")
        
        # Cleanup - delete the test logbook
        logbook_id = created_logbook.get("logbook_id")
        if logbook_id:
            user_session.delete(f"{BASE_URL}/api/logbooks/{logbook_id}", timeout=30)


class TestOwnershipEnforcement:
    """Test that users can only modify/delete their OWN resources"""
    
    @pytest.fixture
    def user_session(self):
        """Create authenticated demo user session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "user@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        session.user_id = response.json()["user"]["user_id"]
        return session
    
    @pytest.fixture
    def admin_session(self):
        """Create authenticated demo admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/demo-login",
            json={"email": "admin@demo.com", "password": "password"},
            timeout=30
        )
        assert response.status_code == 200
        session.user_id = response.json()["user"]["user_id"]
        return session
    
    def test_user_can_update_own_logbook(self, user_session):
        """User can update their OWN logbook"""
        # First create a logbook for the user
        unique_date = f"2098-12-{uuid.uuid4().hex[:2].zfill(2)[-2:]}"
        logbook_data = {
            "tanggal_dinas": unique_date,
            "shift": "PAGI",
            "jam_datang": "07:00",
            "jam_pulang": "14:00",
            "daftar_tindakan": []
        }
        
        create_response = user_session.post(
            f"{BASE_URL}/api/logbooks",
            json=logbook_data,
            timeout=30
        )
        
        if create_response.status_code != 201:
            pytest.skip(f"Could not create test logbook: {create_response.text}")
        
        logbook_id = create_response.json().get("logbook_id")
        
        # Now update the logbook
        update_data = {
            "tanggal_dinas": unique_date,
            "shift": "SIANG",  # Changed
            "jam_datang": "14:00",
            "jam_pulang": "21:00",
            "daftar_tindakan": []
        }
        
        update_response = user_session.put(
            f"{BASE_URL}/api/logbooks/{logbook_id}",
            json=update_data,
            timeout=30
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        updated_logbook = update_response.json()
        assert updated_logbook.get("shift") == "SIANG", "Shift should be updated"
        
        print(f"PASS: User can update their own logbook")
        
        # Cleanup
        user_session.delete(f"{BASE_URL}/api/logbooks/{logbook_id}", timeout=30)
    
    def test_user_can_delete_own_logbook(self, user_session):
        """User can delete their OWN logbook"""
        # First create a logbook for the user
        unique_date = f"2097-12-{uuid.uuid4().hex[:2].zfill(2)[-2:]}"
        logbook_data = {
            "tanggal_dinas": unique_date,
            "shift": "MALAM",
            "jam_datang": "21:00",
            "jam_pulang": "07:00",
            "daftar_tindakan": []
        }
        
        create_response = user_session.post(
            f"{BASE_URL}/api/logbooks",
            json=logbook_data,
            timeout=30
        )
        
        if create_response.status_code != 201:
            pytest.skip(f"Could not create test logbook: {create_response.text}")
        
        logbook_id = create_response.json().get("logbook_id")
        
        # Now delete the logbook
        delete_response = user_session.delete(
            f"{BASE_URL}/api/logbooks/{logbook_id}",
            timeout=30
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        print(f"PASS: User can delete their own logbook")
    
    def test_user_cannot_update_other_users_logbook(self, user_session, admin_session):
        """User cannot update another user's logbook - returns 404"""
        # Create a logbook as admin
        unique_date = f"2096-12-{uuid.uuid4().hex[:2].zfill(2)[-2:]}"
        logbook_data = {
            "tanggal_dinas": unique_date,
            "shift": "PAGI",
            "jam_datang": "07:00",
            "jam_pulang": "14:00",
            "daftar_tindakan": []
        }
        
        create_response = admin_session.post(
            f"{BASE_URL}/api/logbooks",
            json=logbook_data,
            timeout=30
        )
        
        if create_response.status_code != 201:
            pytest.skip(f"Could not create test logbook: {create_response.text}")
        
        admin_logbook_id = create_response.json().get("logbook_id")
        
        # Try to update admin's logbook as user - should return 404
        update_data = {
            "tanggal_dinas": unique_date,
            "shift": "SIANG",
            "jam_datang": "14:00",
            "jam_pulang": "21:00",
            "daftar_tindakan": []
        }
        
        update_response = user_session.put(
            f"{BASE_URL}/api/logbooks/{admin_logbook_id}",
            json=update_data,
            timeout=30
        )
        
        assert update_response.status_code == 404, \
            f"Expected 404 when user tries to update admin's logbook, got {update_response.status_code}: {update_response.text}"
        
        print(f"PASS: User cannot update another user's logbook (returns 404)")
        
        # Cleanup - admin deletes their own logbook
        admin_session.delete(f"{BASE_URL}/api/logbooks/{admin_logbook_id}", timeout=30)
    
    def test_user_cannot_delete_other_users_logbook(self, user_session, admin_session):
        """User cannot delete another user's logbook - returns 404"""
        # Create a logbook as admin
        unique_date = f"2095-12-{uuid.uuid4().hex[:2].zfill(2)[-2:]}"
        logbook_data = {
            "tanggal_dinas": unique_date,
            "shift": "PAGI",
            "jam_datang": "07:00",
            "jam_pulang": "14:00",
            "daftar_tindakan": []
        }
        
        create_response = admin_session.post(
            f"{BASE_URL}/api/logbooks",
            json=logbook_data,
            timeout=30
        )
        
        if create_response.status_code != 201:
            pytest.skip(f"Could not create test logbook: {create_response.text}")
        
        admin_logbook_id = create_response.json().get("logbook_id")
        
        # Try to delete admin's logbook as user - should return 404
        delete_response = user_session.delete(
            f"{BASE_URL}/api/logbooks/{admin_logbook_id}",
            timeout=30
        )
        
        assert delete_response.status_code == 404, \
            f"Expected 404 when user tries to delete admin's logbook, got {delete_response.status_code}: {delete_response.text}"
        
        print(f"PASS: User cannot delete another user's logbook (returns 404)")
        
        # Cleanup - admin deletes their own logbook
        admin_session.delete(f"{BASE_URL}/api/logbooks/{admin_logbook_id}", timeout=30)


class TestHealthCheck:
    """Basic health check - should work without auth"""
    
    def test_health_endpoint(self):
        """GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", "Health status should be 'healthy'"
        print("PASS: GET /api/health returns 200 with healthy status")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
