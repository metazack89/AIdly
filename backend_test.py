#!/usr/bin/env python3
"""
Aidly PWA Backend API Testing Suite
Tests all backend endpoints for the medical emergency assistant
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AidlyAPITester:
    def __init__(self, base_url: str = "https://rescate-digital.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_check(self) -> bool:
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                services_status = data.get("services", {})
                
                details = f"Status: {data.get('status')}, Services: {services_status}"
                self.log_test("Health Check", True, details, data)
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_root_endpoint(self) -> bool:
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Root Endpoint", True, f"Message: {data.get('message')}", data)
                return True
            else:
                self.log_test("Root Endpoint", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_medical_procedures(self) -> bool:
        """Test medical procedures endpoint"""
        try:
            response = requests.get(f"{self.api_url}/medical-procedures", timeout=10)
            
            if response.status_code == 200:
                procedures = response.json()
                
                if isinstance(procedures, list) and len(procedures) > 0:
                    # Check if we have expected procedures
                    procedure_ids = [p.get('id') for p in procedures]
                    expected_procedures = ['cpr-adult', 'choking-adult', 'burns-minor', 'wounds-bleeding']
                    
                    found_procedures = [pid for pid in expected_procedures if pid in procedure_ids]
                    
                    details = f"Found {len(procedures)} procedures: {found_procedures}"
                    self.log_test("Medical Procedures List", True, details, {"count": len(procedures), "procedures": procedure_ids})
                    return True
                else:
                    self.log_test("Medical Procedures List", False, "No procedures returned or invalid format")
                    return False
            else:
                self.log_test("Medical Procedures List", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Medical Procedures List", False, f"Exception: {str(e)}")
            return False

    def test_specific_procedure(self, procedure_id: str = "cpr-adult") -> bool:
        """Test getting a specific medical procedure"""
        try:
            response = requests.get(f"{self.api_url}/medical-procedures/{procedure_id}", timeout=10)
            
            if response.status_code == 200:
                procedure = response.json()
                
                required_fields = ['id', 'name', 'description', 'steps', 'category']
                missing_fields = [field for field in required_fields if field not in procedure]
                
                if not missing_fields:
                    steps_count = len(procedure.get('steps', []))
                    details = f"Procedure: {procedure.get('name')}, Steps: {steps_count}"
                    self.log_test(f"Specific Procedure ({procedure_id})", True, details, {"steps_count": steps_count})
                    return True
                else:
                    self.log_test(f"Specific Procedure ({procedure_id})", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test(f"Specific Procedure ({procedure_id})", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(f"Specific Procedure ({procedure_id})", False, f"Exception: {str(e)}")
            return False

    def test_auth_endpoints_without_token(self) -> bool:
        """Test authentication endpoints without valid token (should fail)"""
        try:
            # Test profile endpoint without auth
            response = requests.get(f"{self.api_url}/profile", timeout=10)
            
            if response.status_code == 401:
                self.log_test("Auth Protection", True, "Profile endpoint properly protected")
                return True
            else:
                self.log_test("Auth Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Auth Protection", False, f"Exception: {str(e)}")
            return False

    def test_emergency_contacts_without_auth(self) -> bool:
        """Test emergency contacts endpoint without auth (should fail)"""
        try:
            response = requests.get(f"{self.api_url}/emergency-contacts", timeout=10)
            
            if response.status_code == 401:
                self.log_test("Emergency Contacts Auth Protection", True, "Endpoint properly protected")
                return True
            else:
                self.log_test("Emergency Contacts Auth Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Emergency Contacts Auth Protection", False, f"Exception: {str(e)}")
            return False

    def test_sos_without_auth(self) -> bool:
        """Test SOS endpoint without auth (should fail)"""
        try:
            response = requests.post(f"{self.api_url}/emergency/sos", 
                                   json={"emergency_type": "medical"}, 
                                   timeout=10)
            
            if response.status_code == 401:
                self.log_test("SOS Auth Protection", True, "SOS endpoint properly protected")
                return True
            else:
                self.log_test("SOS Auth Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("SOS Auth Protection", False, f"Exception: {str(e)}")
            return False

    def test_location_services_without_auth(self) -> bool:
        """Test location services without auth (should fail)"""
        try:
            response = requests.post(f"{self.api_url}/location/reverse-geocode", 
                                   json={"latitude": 40.7128, "longitude": -74.0060}, 
                                   timeout=10)
            
            if response.status_code == 401:
                self.log_test("Location Services Auth Protection", True, "Location endpoint properly protected")
                return True
            else:
                self.log_test("Location Services Auth Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Location Services Auth Protection", False, f"Exception: {str(e)}")
            return False

    def test_image_generation_without_auth(self) -> bool:
        """Test image generation without auth (should fail)"""
        try:
            response = requests.post(f"{self.api_url}/generate-image", 
                                   json={"prompt": "CPR procedure"}, 
                                   timeout=10)
            
            if response.status_code == 401:
                self.log_test("Image Generation Auth Protection", True, "Image generation endpoint properly protected")
                return True
            else:
                self.log_test("Image Generation Auth Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Image Generation Auth Protection", False, f"Exception: {str(e)}")
            return False

    def test_cors_headers(self) -> bool:
        """Test CORS headers are present"""
        try:
            response = requests.options(f"{self.api_url}/health", timeout=10)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if any(cors_headers.values()):
                self.log_test("CORS Headers", True, f"CORS headers present: {cors_headers}")
                return True
            else:
                self.log_test("CORS Headers", False, "No CORS headers found")
                return False
                
        except Exception as e:
            self.log_test("CORS Headers", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all backend tests"""
        print("🏥 Starting Aidly Backend API Tests...")
        print(f"🔗 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Core API tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Medical procedures tests
        self.test_medical_procedures()
        self.test_specific_procedure("cpr-adult")
        self.test_specific_procedure("choking-adult")
        self.test_specific_procedure("burns-minor")
        self.test_specific_procedure("wounds-bleeding")
        
        # Authentication protection tests
        self.test_auth_endpoints_without_token()
        self.test_emergency_contacts_without_auth()
        self.test_sos_without_auth()
        self.test_location_services_without_auth()
        self.test_image_generation_without_auth()
        
        # Infrastructure tests
        self.test_cors_headers()
        
        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
        else:
            print("⚠️  Some backend tests failed - check details above")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": success_rate,
            "test_results": self.test_results,
            "summary": f"{self.tests_passed}/{self.tests_run} tests passed ({success_rate:.1f}%)"
        }

def main():
    """Main test execution"""
    tester = AidlyAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())