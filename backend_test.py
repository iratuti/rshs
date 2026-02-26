import requests
import json
from datetime import datetime
import uuid

class SepulangDinasAPITester:
    def __init__(self, base_url="https://dinas-nurse.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1772073781620"  # From MongoDB setup
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"  └─ {details}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, use_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('/api/') else f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.text else {}
                    details = f"Status: {response.status_code}"
                    if response_data and isinstance(response_data, dict):
                        if 'message' in response_data:
                            details += f", Message: {response_data['message']}"
                        elif len(str(response_data)) < 100:
                            details += f", Data keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'array'}"
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            else:
                details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", use_auth=False)

    def test_auth_me(self):
        """Test authenticated user endpoint"""
        success, data = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success and 'user_id' in data:
            self.user_id = data['user_id']
        return success, data

    def test_patients_crud(self):
        """Test patient CRUD operations"""
        # Get patients
        success, patients = self.run_test("Get All Patients", "GET", "patients", 200)
        
        # Create patient
        patient_data = {
            "nama_pasien": "Test Patient API",
            "no_rm": f"RM{uuid.uuid4().hex[:6]}",
            "no_billing": f"BILL{uuid.uuid4().hex[:6]}",
            "diagnosa": "Test Diagnosis for API Testing"
        }
        
        success, created_patient = self.run_test("Create Patient", "POST", "patients", 201, patient_data)
        patient_id = None
        if success and 'patient_id' in created_patient:
            patient_id = created_patient['patient_id']
            
            # Update patient
            update_data = {
                "nama_pasien": "Updated Test Patient",
                "no_rm": patient_data["no_rm"],
                "no_billing": patient_data["no_billing"],
                "diagnosa": "Updated Diagnosis"
            }
            self.run_test("Update Patient", "PUT", f"patients/{patient_id}", 200, update_data)
            
            # Delete patient
            self.run_test("Delete Patient", "DELETE", f"patients/{patient_id}", 200)

        # Search patients
        self.run_test("Search Patients", "GET", "patients/search?q=test", 200)

        return success

    def test_logbooks(self):
        """Test logbook operations"""
        # Get today's logbook
        self.run_test("Get Today Logbook", "GET", "logbooks/today", 200)
        
        # Get all logbooks
        self.run_test("Get All Logbooks", "GET", "logbooks", 200)
        
        # Create logbook
        logbook_data = {
            "tanggal_dinas": datetime.now().strftime("%Y-%m-%d"),
            "shift": "PAGI",
            "jam_datang": "07:00",
            "jam_pulang": "14:00",
            "daftar_tindakan": []
        }
        
        success, created_logbook = self.run_test("Create Logbook", "POST", "logbooks", 201, logbook_data)
        
        if success and 'logbook_id' in created_logbook:
            logbook_id = created_logbook['logbook_id']
            
            # Test adding tindakan to logbook
            tindakan_data = {
                "patient_id": "test_patient_123",
                "nama_pasien": "Test Patient for Logbook",
                "no_rm": "RM123",
                "no_billing": "BILL123",
                "diagnosa": "Test diagnosis",
                "keterangan_tindakan": ["Observasi EWS per jam", "Memberikan obat"],
                "catatan_lainnya": "Test catatan",
                "oksigenasi": True,
                "injeksi": True
            }
            
            self.run_test("Add Tindakan to Logbook", "POST", f"logbooks/{logbook_id}/tindakan", 200, tindakan_data)
            
            # Delete logbook
            self.run_test("Delete Logbook", "DELETE", f"logbooks/{logbook_id}", 200)

    def test_tickets(self):
        """Test support ticket operations"""
        # Create ticket
        ticket_data = {
            "kategori": "Teknis",
            "subjek": "Test Ticket from API",
            "pesan_user": "This is a test ticket created via API testing"
        }
        
        success, created_ticket = self.run_test("Create Ticket", "POST", "tickets", 201, ticket_data)
        
        # Get user tickets
        self.run_test("Get User Tickets", "GET", "tickets", 200)

    def test_billing(self):
        """Test billing endpoints (mocked)"""
        # Test create transaction (mocked)
        self.run_test("Create Transaction (MOCK)", "POST", "billing/create-transaction", 200, {})
        
        # Test webhook (mocked)  
        self.run_test("Midtrans Webhook (MOCK)", "POST", "webhook/midtrans", 200, {"test": "data"}, use_auth=False)

    def test_admin_endpoints(self):
        """Test admin endpoints (should fail with current user role)"""
        # These should fail with 403 since we're using USER role
        self.run_test("Get All Users (Admin)", "GET", "admin/users", 403)
        self.run_test("Get All Tickets (Admin)", "GET", "admin/tickets", 403)
        self.run_test("Get Admin Stats", "GET", "admin/stats", 403)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting SepulangDinas API Testing...")
        print(f"📡 Testing against: {self.base_url}")
        print(f"🔑 Using session token: {self.session_token[:20]}...")
        print("=" * 60)

        # Basic tests
        self.test_health()
        self.test_auth_me()
        
        # Core functionality
        self.test_patients_crud()
        self.test_logbooks()
        self.test_tickets()
        
        # Billing (mocked)
        self.test_billing()
        
        # Admin tests (should fail)
        self.test_admin_endpoints()

        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        # Failed tests summary
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n🎉 All tests passed!")

        return self.tests_passed, self.tests_run, self.test_results

if __name__ == "__main__":
    tester = SepulangDinasAPITester()
    tester.run_all_tests()