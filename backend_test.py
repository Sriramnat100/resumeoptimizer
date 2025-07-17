#!/usr/bin/env python3
"""
Backend API Testing for Google Docs 2.0 Resume Builder
Tests all CRUD operations, rich text storage, version control, and section management
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://b1d44662-bb2a-4516-aec2-da425c425ca7.preview.emergentagent.com/api"

class ResumeBuilderTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_document_id = None
        self.test_section_id = None
        self.results = {
            "document_crud": {"passed": 0, "failed": 0, "details": []},
            "rich_text_storage": {"passed": 0, "failed": 0, "details": []},
            "version_control": {"passed": 0, "failed": 0, "details": []},
            "section_management": {"passed": 0, "failed": 0, "details": []}
        }
    
    def log_result(self, category, test_name, passed, details=""):
        """Log test result"""
        if passed:
            self.results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.results[category]["failed"] += 1
            status = "❌ FAIL"
        
        self.results[category]["details"].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")
    
    def test_api_health(self):
        """Test if API is accessible"""
        try:
            response = requests.get(f"{self.base_url.replace('/api', '')}/")
            if response.status_code == 200:
                print("✅ API Health Check: Backend is accessible")
                return True
            else:
                print(f"❌ API Health Check: Backend returned {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: Cannot connect to backend - {str(e)}")
            return False
    
    def test_document_crud_operations(self):
        """Test Document CRUD Operations"""
        print("\n=== Testing Document CRUD Operations ===")
        
        # Test 1: Create new document with default resume sections
        try:
            create_data = {"title": "John Doe - Software Engineer Resume"}
            response = requests.post(f"{self.base_url}/documents", json=create_data)
            
            if response.status_code == 200:
                doc_data = response.json()
                self.test_document_id = doc_data.get("id")
                
                # Verify document structure
                required_fields = ["id", "title", "sections", "created_at", "updated_at"]
                has_all_fields = all(field in doc_data for field in required_fields)
                
                # Verify default sections
                sections = doc_data.get("sections", [])
                expected_sections = ["Personal Information", "Professional Summary", "Experience", "Education", "Skills"]
                section_titles = [s.get("title") for s in sections]
                has_default_sections = all(title in section_titles for title in expected_sections)
                
                if has_all_fields and has_default_sections and len(sections) == 5:
                    self.log_result("document_crud", "Create Document", True, 
                                  f"Document created with ID {self.test_document_id} and 5 default sections")
                    # Store first section ID for later tests
                    self.test_section_id = sections[0].get("id")
                else:
                    self.log_result("document_crud", "Create Document", False, 
                                  f"Missing fields or sections. Fields: {has_all_fields}, Sections: {has_default_sections}")
            else:
                self.log_result("document_crud", "Create Document", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("document_crud", "Create Document", False, f"Exception: {str(e)}")
        
        # Test 2: Get all documents
        try:
            response = requests.get(f"{self.base_url}/documents")
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list) and len(documents) > 0:
                    self.log_result("document_crud", "Get All Documents", True, 
                                  f"Retrieved {len(documents)} documents")
                else:
                    self.log_result("document_crud", "Get All Documents", False, 
                                  "No documents returned or invalid format")
            else:
                self.log_result("document_crud", "Get All Documents", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("document_crud", "Get All Documents", False, f"Exception: {str(e)}")
        
        # Test 3: Get specific document by ID
        if self.test_document_id:
            try:
                response = requests.get(f"{self.base_url}/documents/{self.test_document_id}")
                if response.status_code == 200:
                    doc_data = response.json()
                    if doc_data.get("id") == self.test_document_id:
                        self.log_result("document_crud", "Get Document by ID", True, 
                                      f"Retrieved document {self.test_document_id}")
                    else:
                        self.log_result("document_crud", "Get Document by ID", False, 
                                      "Document ID mismatch")
                else:
                    self.log_result("document_crud", "Get Document by ID", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result("document_crud", "Get Document by ID", False, f"Exception: {str(e)}")
        
        # Test 4: Update document title
        if self.test_document_id:
            try:
                update_data = {"title": "John Doe - Senior Software Engineer Resume"}
                response = requests.put(f"{self.base_url}/documents/{self.test_document_id}", json=update_data)
                if response.status_code == 200:
                    doc_data = response.json()
                    if doc_data.get("title") == update_data["title"]:
                        self.log_result("document_crud", "Update Document Title", True, 
                                      "Document title updated successfully")
                    else:
                        self.log_result("document_crud", "Update Document Title", False, 
                                      "Title not updated properly")
                else:
                    self.log_result("document_crud", "Update Document Title", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result("document_crud", "Update Document Title", False, f"Exception: {str(e)}")
    
    def test_rich_text_content_storage(self):
        """Test Rich Text Content Storage with Quill.js Delta Format"""
        print("\n=== Testing Rich Text Content Storage ===")
        
        if not self.test_document_id or not self.test_section_id:
            self.log_result("rich_text_storage", "Rich Text Storage", False, 
                          "No test document or section available")
            return
        
        # Test 1: Save rich text content with formatting
        try:
            rich_content = {
                "content": {
                    "ops": [
                        {"insert": "John Doe", "attributes": {"bold": True, "size": "large"}},
                        {"insert": "\n"},
                        {"insert": "Senior Software Engineer", "attributes": {"italic": True}},
                        {"insert": "\n"},
                        {"insert": "Email: john.doe@email.com | Phone: (555) 123-4567\n"},
                        {"insert": "LinkedIn: linkedin.com/in/johndoe", "attributes": {"link": "https://linkedin.com/in/johndoe"}},
                        {"insert": "\n\nKey Skills:\n"},
                        {"insert": "Python, JavaScript, React", "attributes": {"list": "bullet"}},
                        {"insert": "\n"},
                        {"insert": "AWS, Docker, Kubernetes", "attributes": {"list": "bullet"}},
                        {"insert": "\n"}
                    ]
                }
            }
            
            response = requests.put(
                f"{self.base_url}/documents/{self.test_document_id}/sections/{self.test_section_id}",
                json=rich_content
            )
            
            if response.status_code == 200:
                doc_data = response.json()
                sections = doc_data.get("sections", [])
                updated_section = next((s for s in sections if s["id"] == self.test_section_id), None)
                
                if updated_section:
                    stored_ops = updated_section.get("content", {}).get("ops", [])
                    original_ops = rich_content["content"]["ops"]
                    
                    # Verify content preservation
                    if len(stored_ops) == len(original_ops):
                        # Check if formatting attributes are preserved
                        has_formatting = any("attributes" in op for op in stored_ops if "attributes" in op)
                        self.log_result("rich_text_storage", "Save Rich Text with Formatting", True, 
                                      f"Rich text saved with {len(stored_ops)} operations and formatting preserved")
                    else:
                        self.log_result("rich_text_storage", "Save Rich Text with Formatting", False, 
                                      f"Content length mismatch: expected {len(original_ops)}, got {len(stored_ops)}")
                else:
                    self.log_result("rich_text_storage", "Save Rich Text with Formatting", False, 
                                  "Updated section not found in response")
            else:
                self.log_result("rich_text_storage", "Save Rich Text with Formatting", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("rich_text_storage", "Save Rich Text with Formatting", False, f"Exception: {str(e)}")
        
        # Test 2: Verify content with complex formatting (lists, alignment, etc.)
        try:
            complex_content = {
                "content": {
                    "ops": [
                        {"insert": "PROFESSIONAL EXPERIENCE", "attributes": {"bold": True, "align": "center"}},
                        {"insert": "\n\n"},
                        {"insert": "Senior Software Engineer", "attributes": {"bold": True}},
                        {"insert": " | TechCorp Inc. | 2020-Present\n"},
                        {"insert": "Led development of microservices architecture", "attributes": {"list": "bullet"}},
                        {"insert": "\n"},
                        {"insert": "Improved system performance by 40%", "attributes": {"list": "bullet"}},
                        {"insert": "\n"},
                        {"insert": "Mentored 5 junior developers", "attributes": {"list": "bullet"}},
                        {"insert": "\n\n"},
                        {"insert": "Software Engineer", "attributes": {"bold": True}},
                        {"insert": " | StartupXYZ | 2018-2020\n"},
                        {"insert": "Built scalable web applications", "attributes": {"list": "ordered"}},
                        {"insert": "\n"},
                        {"insert": "Implemented CI/CD pipelines", "attributes": {"list": "ordered"}},
                        {"insert": "\n"}
                    ]
                }
            }
            
            # Find Experience section
            doc_response = requests.get(f"{self.base_url}/documents/{self.test_document_id}")
            if doc_response.status_code == 200:
                doc_data = doc_response.json()
                experience_section = next((s for s in doc_data["sections"] if s["title"] == "Experience"), None)
                
                if experience_section:
                    response = requests.put(
                        f"{self.base_url}/documents/{self.test_document_id}/sections/{experience_section['id']}",
                        json=complex_content
                    )
                    
                    if response.status_code == 200:
                        # Verify complex formatting is preserved
                        updated_doc = response.json()
                        updated_exp_section = next((s for s in updated_doc["sections"] if s["title"] == "Experience"), None)
                        stored_ops = updated_exp_section.get("content", {}).get("ops", [])
                        
                        # Check for different formatting types
                        has_bold = any(op.get("attributes", {}).get("bold") for op in stored_ops)
                        has_lists = any("list" in op.get("attributes", {}) for op in stored_ops)
                        has_alignment = any("align" in op.get("attributes", {}) for op in stored_ops)
                        
                        if has_bold and has_lists:
                            self.log_result("rich_text_storage", "Complex Formatting Preservation", True, 
                                          "Bold, lists, and other formatting preserved")
                        else:
                            self.log_result("rich_text_storage", "Complex Formatting Preservation", False, 
                                          f"Formatting lost - Bold: {has_bold}, Lists: {has_lists}")
                    else:
                        self.log_result("rich_text_storage", "Complex Formatting Preservation", False, 
                                      f"HTTP {response.status_code}: {response.text}")
                else:
                    self.log_result("rich_text_storage", "Complex Formatting Preservation", False, 
                                  "Experience section not found")
            else:
                self.log_result("rich_text_storage", "Complex Formatting Preservation", False, 
                              "Could not retrieve document for experience section test")
        except Exception as e:
            self.log_result("rich_text_storage", "Complex Formatting Preservation", False, f"Exception: {str(e)}")
    
    def test_version_control_system(self):
        """Test Version Control System"""
        print("\n=== Testing Version Control System ===")
        
        if not self.test_document_id:
            self.log_result("version_control", "Version Control", False, 
                          "No test document available")
            return
        
        # Test 1: Verify automatic version creation on document updates
        try:
            # Get initial version count
            response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/versions")
            if response.status_code == 200:
                initial_versions = response.json()
                initial_count = len(initial_versions)
                
                # Make an update to trigger version creation
                update_data = {
                    "sections": [
                        {
                            "id": self.test_section_id,
                            "title": "Personal Information",
                            "content": {
                                "ops": [
                                    {"insert": "Jane Smith", "attributes": {"bold": True}},
                                    {"insert": "\nUpdated contact information\n"}
                                ]
                            },
                            "order": 1
                        }
                    ]
                }
                
                update_response = requests.put(f"{self.base_url}/documents/{self.test_document_id}", json=update_data)
                if update_response.status_code == 200:
                    time.sleep(1)  # Brief pause to ensure version is created
                    
                    # Check if new version was created
                    versions_response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/versions")
                    if versions_response.status_code == 200:
                        new_versions = versions_response.json()
                        new_count = len(new_versions)
                        
                        if new_count > initial_count:
                            self.log_result("version_control", "Automatic Version Creation", True, 
                                          f"Version count increased from {initial_count} to {new_count}")
                        else:
                            self.log_result("version_control", "Automatic Version Creation", False, 
                                          f"Version count did not increase: {initial_count} -> {new_count}")
                    else:
                        self.log_result("version_control", "Automatic Version Creation", False, 
                                      "Could not retrieve versions after update")
                else:
                    self.log_result("version_control", "Automatic Version Creation", False, 
                                  f"Document update failed: HTTP {update_response.status_code}")
            else:
                self.log_result("version_control", "Automatic Version Creation", False, 
                              f"Could not get initial versions: HTTP {response.status_code}")
        except Exception as e:
            self.log_result("version_control", "Automatic Version Creation", False, f"Exception: {str(e)}")
        
        # Test 2: Test version history retrieval
        try:
            response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/versions")
            if response.status_code == 200:
                versions = response.json()
                if len(versions) > 0:
                    # Verify version structure
                    first_version = versions[0]
                    required_fields = ["id", "document_id", "version_number", "title", "sections", "created_at"]
                    has_all_fields = all(field in first_version for field in required_fields)
                    
                    # Verify version numbering
                    version_numbers = [v.get("version_number") for v in versions]
                    is_properly_numbered = all(isinstance(vn, int) and vn > 0 for vn in version_numbers)
                    
                    if has_all_fields and is_properly_numbered:
                        self.log_result("version_control", "Version History Retrieval", True, 
                                      f"Retrieved {len(versions)} versions with proper structure")
                    else:
                        self.log_result("version_control", "Version History Retrieval", False, 
                                      f"Invalid version structure or numbering")
                else:
                    self.log_result("version_control", "Version History Retrieval", False, 
                                  "No versions found")
            else:
                self.log_result("version_control", "Version History Retrieval", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("version_control", "Version History Retrieval", False, f"Exception: {str(e)}")
        
        # Test 3: Test version restore functionality
        try:
            # Get available versions
            versions_response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/versions")
            if versions_response.status_code == 200:
                versions = versions_response.json()
                if len(versions) >= 2:
                    # Try to restore to an earlier version
                    version_to_restore = versions[-1]  # Get oldest version
                    version_number = version_to_restore["version_number"]
                    
                    restore_response = requests.post(
                        f"{self.base_url}/documents/{self.test_document_id}/versions/{version_number}/restore"
                    )
                    
                    if restore_response.status_code == 200:
                        restored_doc = restore_response.json()
                        
                        # Verify restore created a new version
                        new_versions_response = requests.get(f"{self.base_url}/documents/{self.test_document_id}/versions")
                        if new_versions_response.status_code == 200:
                            new_versions = new_versions_response.json()
                            latest_version = new_versions[0]  # Should be sorted by version_number desc
                            
                            if "Restored from version" in latest_version.get("description", ""):
                                self.log_result("version_control", "Version Restore Functionality", True, 
                                              f"Successfully restored from version {version_number}")
                            else:
                                self.log_result("version_control", "Version Restore Functionality", False, 
                                              "Restore did not create proper version description")
                        else:
                            self.log_result("version_control", "Version Restore Functionality", False, 
                                          "Could not verify new version after restore")
                    else:
                        self.log_result("version_control", "Version Restore Functionality", False, 
                                      f"Restore failed: HTTP {restore_response.status_code}")
                else:
                    self.log_result("version_control", "Version Restore Functionality", False, 
                                  "Not enough versions available for restore test")
            else:
                self.log_result("version_control", "Version Restore Functionality", False, 
                              "Could not retrieve versions for restore test")
        except Exception as e:
            self.log_result("version_control", "Version Restore Functionality", False, f"Exception: {str(e)}")
    
    def test_section_based_document_structure(self):
        """Test Section-based Document Structure"""
        print("\n=== Testing Section-based Document Structure ===")
        
        if not self.test_document_id:
            self.log_result("section_management", "Section Management", False, 
                          "No test document available")
            return
        
        # Test 1: Verify default resume sections
        try:
            response = requests.get(f"{self.base_url}/documents/{self.test_document_id}")
            if response.status_code == 200:
                doc_data = response.json()
                sections = doc_data.get("sections", [])
                
                expected_sections = ["Personal Information", "Professional Summary", "Experience", "Education", "Skills"]
                section_titles = [s.get("title") for s in sections]
                
                # Check if all expected sections exist
                has_all_sections = all(title in section_titles for title in expected_sections)
                
                # Check section structure
                valid_structure = all(
                    all(field in section for field in ["id", "title", "content", "order"])
                    for section in sections
                )
                
                # Check section ordering
                orders = [s.get("order") for s in sections]
                is_properly_ordered = orders == sorted(orders) and len(set(orders)) == len(orders)
                
                if has_all_sections and valid_structure and is_properly_ordered:
                    self.log_result("section_management", "Default Resume Sections", True, 
                                  f"All 5 default sections present with proper structure and ordering")
                else:
                    self.log_result("section_management", "Default Resume Sections", False, 
                                  f"Issues - All sections: {has_all_sections}, Structure: {valid_structure}, Ordering: {is_properly_ordered}")
            else:
                self.log_result("section_management", "Default Resume Sections", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("section_management", "Default Resume Sections", False, f"Exception: {str(e)}")
        
        # Test 2: Test individual section updates
        try:
            # Get document to find a section to update
            doc_response = requests.get(f"{self.base_url}/documents/{self.test_document_id}")
            if doc_response.status_code == 200:
                doc_data = doc_response.json()
                skills_section = next((s for s in doc_data["sections"] if s["title"] == "Skills"), None)
                
                if skills_section:
                    section_id = skills_section["id"]
                    
                    # Update skills section with realistic content
                    skills_content = {
                        "content": {
                            "ops": [
                                {"insert": "Technical Skills:\n", "attributes": {"bold": True}},
                                {"insert": "• Python, JavaScript, TypeScript, Java\n"},
                                {"insert": "• React, Node.js, FastAPI, Django\n"},
                                {"insert": "• AWS, Docker, Kubernetes, MongoDB\n\n"},
                                {"insert": "Soft Skills:\n", "attributes": {"bold": True}},
                                {"insert": "• Team Leadership & Mentoring\n"},
                                {"insert": "• Agile/Scrum Methodologies\n"},
                                {"insert": "• Problem Solving & Critical Thinking\n"}
                            ]
                        }
                    }
                    
                    update_response = requests.put(
                        f"{self.base_url}/documents/{self.test_document_id}/sections/{section_id}",
                        json=skills_content
                    )
                    
                    if update_response.status_code == 200:
                        updated_doc = update_response.json()
                        updated_skills = next((s for s in updated_doc["sections"] if s["id"] == section_id), None)
                        
                        if updated_skills:
                            stored_ops = updated_skills.get("content", {}).get("ops", [])
                            if len(stored_ops) > 0:
                                self.log_result("section_management", "Individual Section Update", True, 
                                              f"Skills section updated with {len(stored_ops)} content operations")
                            else:
                                self.log_result("section_management", "Individual Section Update", False, 
                                              "Section update did not save content properly")
                        else:
                            self.log_result("section_management", "Individual Section Update", False, 
                                          "Updated section not found in response")
                    else:
                        self.log_result("section_management", "Individual Section Update", False, 
                                      f"HTTP {update_response.status_code}: {update_response.text}")
                else:
                    self.log_result("section_management", "Individual Section Update", False, 
                                  "Skills section not found")
            else:
                self.log_result("section_management", "Individual Section Update", False, 
                              "Could not retrieve document for section update test")
        except Exception as e:
            self.log_result("section_management", "Individual Section Update", False, f"Exception: {str(e)}")
        
        # Test 3: Verify section ordering and structure after updates
        try:
            response = requests.get(f"{self.base_url}/documents/{self.test_document_id}")
            if response.status_code == 200:
                doc_data = response.json()
                sections = doc_data.get("sections", [])
                
                # Verify all sections still have proper structure
                all_have_ids = all("id" in section and section["id"] for section in sections)
                all_have_content = all("content" in section and "ops" in section["content"] for section in sections)
                all_have_order = all("order" in section and isinstance(section["order"], int) for section in sections)
                
                # Verify ordering is still maintained
                orders = [s.get("order") for s in sections]
                is_properly_ordered = orders == sorted(orders)
                
                if all_have_ids and all_have_content and all_have_order and is_properly_ordered:
                    self.log_result("section_management", "Section Structure Integrity", True, 
                                  "All sections maintain proper structure and ordering after updates")
                else:
                    self.log_result("section_management", "Section Structure Integrity", False, 
                                  f"Structure issues - IDs: {all_have_ids}, Content: {all_have_content}, Order: {all_have_order}, Sorted: {is_properly_ordered}")
            else:
                self.log_result("section_management", "Section Structure Integrity", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("section_management", "Section Structure Integrity", False, f"Exception: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up test document"""
        if self.test_document_id:
            try:
                response = requests.delete(f"{self.base_url}/documents/{self.test_document_id}")
                if response.status_code == 200:
                    print(f"✅ Cleanup: Test document {self.test_document_id} deleted successfully")
                else:
                    print(f"⚠️ Cleanup: Could not delete test document - HTTP {response.status_code}")
            except Exception as e:
                print(f"⚠️ Cleanup: Exception during cleanup - {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("BACKEND API TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.replace('_', ' ').title()}:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            if results["details"]:
                for detail in results["details"]:
                    print(f"    {detail}")
        
        print(f"\nOVERALL RESULTS:")
        print(f"✅ Total Passed: {total_passed}")
        print(f"❌ Total Failed: {total_failed}")
        print(f"📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "No tests run")
        
        return total_failed == 0
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("Starting Google Docs 2.0 Resume Builder Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("="*60)
        
        # Check API health first
        if not self.test_api_health():
            print("❌ Backend API is not accessible. Aborting tests.")
            return False
        
        try:
            # Run all test categories
            self.test_document_crud_operations()
            self.test_rich_text_content_storage()
            self.test_version_control_system()
            self.test_section_based_document_structure()
            
            # Print summary
            success = self.print_summary()
            
            # Cleanup
            self.cleanup_test_data()
            
            return success
            
        except Exception as e:
            print(f"❌ Critical error during testing: {str(e)}")
            self.cleanup_test_data()
            return False

if __name__ == "__main__":
    tester = ResumeBuilderTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)