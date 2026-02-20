"""
Backend API Tests for DLLC HR & Payroll Application
Tests: Auth, Employees, Attendance, Documents, Salary, Leaves, Announcements
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "anil.lalwani@dllc.com"
ADMIN_EMAIL = "admin@dllc.com"
EMPLOYEE_EMAIL = "eshwar.p@dllc.com"
PASSWORD = "demo123"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        print(f"SUCCESS: Health check passed - {data}")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={})
        assert response.status_code == 400
        print("SUCCESS: Login correctly rejects missing credentials")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Login correctly rejects invalid credentials")
    
    def test_login_director_success(self):
        """Test director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == DIRECTOR_EMAIL
        assert data["user"]["role"] == "Director"
        print(f"SUCCESS: Director login - {data['user']['full_name']}")
    
    def test_login_admin_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "Admin"
        print(f"SUCCESS: Admin login - {data['user']['full_name']}")
    
    def test_login_employee_success(self):
        """Test employee login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "Employee"
        print(f"SUCCESS: Employee login - {data['user']['full_name']}")


@pytest.fixture
def director_token():
    """Get director auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DIRECTOR_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Director authentication failed")


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture
def employee_token():
    """Get employee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": EMPLOYEE_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Employee authentication failed")


class TestEmployees:
    """Employee management endpoint tests"""
    
    def test_get_employees_unauthorized(self):
        """Test getting employees without auth"""
        response = requests.get(f"{BASE_URL}/api/employees")
        assert response.status_code == 401
        print("SUCCESS: Employees endpoint requires authentication")
    
    def test_get_employees_as_director(self, director_token):
        """Test getting all employees as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/employees", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: Director can view {len(data)} employees")
        
        # Verify employee data structure
        emp = data[0]
        assert "full_name" in emp
        assert "email" in emp
        assert "employee_id" in emp
        assert "status" in emp
    
    def test_get_employees_as_admin(self, admin_token):
        """Test getting all employees as admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/employees", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin can view {len(data)} employees")
    
    def test_filter_employees_by_status(self, director_token):
        """Test filtering employees by status"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/employees?status=Active", headers=headers)
        assert response.status_code == 200
        data = response.json()
        for emp in data:
            assert emp["status"] == "Active"
        print(f"SUCCESS: Filtered {len(data)} active employees")


class TestAttendance:
    """Attendance endpoint tests"""
    
    def test_get_attendance_unauthorized(self):
        """Test getting attendance without auth"""
        response = requests.get(f"{BASE_URL}/api/attendance")
        assert response.status_code == 401
        print("SUCCESS: Attendance endpoint requires authentication")
    
    def test_get_today_attendance(self, employee_token):
        """Test getting today's attendance"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/today", headers=headers)
        assert response.status_code in [200, 404]  # 404 if no attendance today
        print(f"SUCCESS: Today's attendance check - status {response.status_code}")
    
    def test_check_in(self, employee_token):
        """Test employee check-in"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.post(f"{BASE_URL}/api/attendance/checkin", headers=headers)
        # May return 200 (success), 201 (created), or 400 (already checked in)
        assert response.status_code in [200, 201, 400]
        print(f"SUCCESS: Check-in test - status {response.status_code}")
    
    def test_get_attendance_history(self, director_token):
        """Test getting attendance history as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Handle pagination response
        if isinstance(data, dict) and "data" in data:
            records = data["data"]
        else:
            records = data
        print(f"SUCCESS: Retrieved {len(records)} attendance records")


class TestLeaves:
    """Leave management endpoint tests"""
    
    def test_get_leaves_unauthorized(self):
        """Test getting leaves without auth"""
        response = requests.get(f"{BASE_URL}/api/leaves")
        assert response.status_code == 401
        print("SUCCESS: Leaves endpoint requires authentication")
    
    def test_get_leaves_as_director(self, director_token):
        """Test getting all leaves as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/leaves", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Handle pagination response
        if isinstance(data, dict) and "data" in data:
            leaves = data["data"]
        else:
            leaves = data
        print(f"SUCCESS: Director can view {len(leaves)} leave requests")


class TestDocuments:
    """Document management endpoint tests"""
    
    def test_get_documents_unauthorized(self):
        """Test getting documents without auth"""
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 401
        print("SUCCESS: Documents endpoint requires authentication")
    
    def test_get_documents_as_employee(self, employee_token):
        """Test getting documents as employee"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Employee can view {len(data)} documents")
    
    def test_get_documents_as_director(self, director_token):
        """Test getting all documents as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Director can view {len(data)} documents")


class TestSalary:
    """Salary/Payroll endpoint tests"""
    
    def test_get_salary_unauthorized(self):
        """Test getting salary without auth"""
        response = requests.get(f"{BASE_URL}/api/salary")
        assert response.status_code == 401
        print("SUCCESS: Salary endpoint requires authentication")
    
    def test_get_salary_as_director(self, director_token):
        """Test getting all salary records as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/salary", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Director can view {len(data)} salary records")


class TestAnnouncements:
    """Announcements endpoint tests"""
    
    def test_get_announcements_unauthorized(self):
        """Test getting announcements without auth"""
        response = requests.get(f"{BASE_URL}/api/announcements")
        assert response.status_code == 401
        print("SUCCESS: Announcements endpoint requires authentication")
    
    def test_get_announcements_as_employee(self, employee_token):
        """Test getting announcements as employee"""
        headers = {"Authorization": f"Bearer {employee_token}"}
        response = requests.get(f"{BASE_URL}/api/announcements", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Employee can view {len(data)} announcements")


class TestDemoUsers:
    """Demo users endpoint tests"""
    
    def test_load_demo_users(self):
        """Test loading demo users"""
        response = requests.post(f"{BASE_URL}/api/demo/load-users")
        assert response.status_code in [200, 201]
        data = response.json()
        assert "created_count" in data or "message" in data
        print(f"SUCCESS: Demo users endpoint works - {data}")


class TestCurrentUser:
    """Current user endpoint tests"""
    
    def test_get_me_unauthorized(self):
        """Test getting current user without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: /me endpoint requires authentication")
    
    def test_get_me_as_director(self, director_token):
        """Test getting current user as director"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == DIRECTOR_EMAIL
        assert data["role"] == "Director"
        print(f"SUCCESS: Director profile retrieved - {data['full_name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
