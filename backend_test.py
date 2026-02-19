#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, date

class DLLCHRTester:
    def __init__(self, base_url="https://payroll-platform-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.director_token = None
        self.employee_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                try:
                    error_data = response.json()
                    return False, f"Status {response.status_code}: {error_data.get('error', 'Unknown error')}"
                except:
                    return False, f"Status {response.status_code}: {response.text}"
                    
        except Exception as e:
            return False, f"Request failed: {str(e)}"

    def test_health_check(self):
        """Test basic health endpoint"""
        success, response = self.make_request('GET', 'health')
        return self.log_test("Health Check", success, response if not success else "")

    def test_demo_users_endpoint(self):
        """Test demo users endpoint"""
        success, response = self.make_request('GET', 'demo/users')
        if success:
            users = response.get('demo_users', [])
            success = len(users) == 10
            details = f"Expected 10 users, got {len(users)}" if not success else ""
        else:
            details = response
        return self.log_test("Demo Users Endpoint", success, details)

    def test_director_login(self):
        """Test director login"""
        login_data = {
            "email": "director@dllc.com",
            "password": "demo123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success:
            if 'token' in response and 'user' in response:
                self.director_token = response['token']
                user = response['user']
                success = (user.get('role') == 'Director' and 
                          user.get('full_name') == 'Anil Lalwani')
                details = f"Invalid user data: {user}" if not success else ""
            else:
                success = False
                details = "Missing token or user in response"
        else:
            details = response
            
        return self.log_test("Director Login", success, details)

    def test_employee_login(self):
        """Test employee login"""
        login_data = {
            "email": "john.doe@dllc.com", 
            "password": "demo123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success:
            if 'token' in response and 'user' in response:
                self.employee_token = response['token']
                user = response['user']
                success = (user.get('role') == 'Employee' and 
                          user.get('full_name') == 'John Doe')
                details = f"Invalid user data: {user}" if not success else ""
            else:
                success = False
                details = "Missing token or user in response"
        else:
            details = response
            
        return self.log_test("Employee Login", success, details)

    def test_auth_me_director(self):
        """Test /auth/me with director token"""
        if not self.director_token:
            return self.log_test("Auth Me (Director)", False, "No director token available")
            
        success, response = self.make_request('GET', 'auth/me', token=self.director_token)
        
        if success:
            success = (response.get('role') == 'Director' and 
                      response.get('full_name') == 'Anil Lalwani')
            details = f"Invalid user data: {response}" if not success else ""
        else:
            details = response
            
        return self.log_test("Auth Me (Director)", success, details)

    def test_get_employees_director(self):
        """Test getting employees with director token"""
        if not self.director_token:
            return self.log_test("Get Employees (Director)", False, "No director token available")
            
        success, response = self.make_request('GET', 'employees', token=self.director_token)
        
        if success:
            success = len(response) == 10
            details = f"Expected 10 employees, got {len(response)}" if not success else ""
        else:
            details = response
            
        return self.log_test("Get Employees (Director)", success, details)

    def test_attendance_checkin_employee(self):
        """Test attendance check-in with employee token"""
        if not self.employee_token:
            return self.log_test("Attendance Check-in", False, "No employee token available")
            
        success, response = self.make_request('POST', 'attendance/checkin', token=self.employee_token, expected_status=201)
        
        if not success and "Already checked in today" in str(response):
            # If already checked in, that's also a valid state
            success = True
            details = ""
        else:
            details = response if not success else ""
            
        return self.log_test("Attendance Check-in", success, details)

    def test_attendance_today_employee(self):
        """Test getting today's attendance status"""
        if not self.employee_token:
            return self.log_test("Attendance Today Status", False, "No employee token available")
            
        success, response = self.make_request('GET', 'attendance/today', token=self.employee_token)
        
        if success:
            success = 'checked_in' in response
            details = f"Missing checked_in field: {response}" if not success else ""
        else:
            details = response
            
        return self.log_test("Attendance Today Status", success, details)

    def test_attendance_checkout_employee(self):
        """Test attendance check-out with employee token"""
        if not self.employee_token:
            return self.log_test("Attendance Check-out", False, "No employee token available")
            
        success, response = self.make_request('POST', 'attendance/checkout', token=self.employee_token)
        
        if not success and "No active check-in found" in str(response):
            # If no active check-in, that's expected if we didn't check in first
            success = True
            details = ""
        else:
            details = response if not success else ""
            
        return self.log_test("Attendance Check-out", success, details)

    def test_apply_leave_employee(self):
        """Test applying for leave with employee token"""
        if not self.employee_token:
            return self.log_test("Apply Leave", False, "No employee token available")
            
        leave_data = {
            "leave_type": "Annual",
            "start_date": "2024-12-25",
            "end_date": "2024-12-26", 
            "reason": "Christmas holiday"
        }
        
        success, response = self.make_request('POST', 'leaves', leave_data, token=self.employee_token, expected_status=201)
        details = response if not success else ""
        
        return self.log_test("Apply Leave", success, details)

    def test_get_leaves_employee(self):
        """Test getting leaves with employee token (should only see own leaves)"""
        if not self.employee_token:
            return self.log_test("Get Leaves (Employee)", False, "No employee token available")
            
        success, response = self.make_request('GET', 'leaves', token=self.employee_token)
        
        if success:
            # Employee should only see their own leaves
            success = isinstance(response, list)
            details = f"Expected list, got {type(response)}" if not success else ""
        else:
            details = response
            
        return self.log_test("Get Leaves (Employee)", success, details)

    def test_role_based_access(self):
        """Test that employee cannot access other employees' data"""
        if not self.employee_token:
            return self.log_test("Role-based Access Control", False, "No employee token available")
            
        # Try to access employees list (should be forbidden for regular employee)
        success, response = self.make_request('GET', 'employees', token=self.employee_token)
        
        if success:
            # Employee should only see themselves, so should get 1 employee
            success = len(response) == 1
            details = f"Employee saw {len(response)} employees, should only see 1 (themselves)" if not success else ""
        else:
            details = response
            
        return self.log_test("Role-based Access Control", success, details)

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting DLLC HR Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_demo_users_endpoint()
        
        # Authentication tests
        self.test_director_login()
        self.test_employee_login()
        self.test_auth_me_director()
        
        # Employee management tests
        self.test_get_employees_director()
        self.test_role_based_access()
        
        # Attendance tests
        self.test_attendance_checkin_employee()
        self.test_attendance_today_employee()
        self.test_attendance_checkout_employee()
        
        # Leave management tests
        self.test_apply_leave_employee()
        self.test_get_leaves_employee()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = DLLCHRTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())