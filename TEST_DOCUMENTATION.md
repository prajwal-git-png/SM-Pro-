# SalesPro Testing Documentation

## 1. Test Planning
The testing strategy for SalesPro focuses on **Local-First Reliability**, **Geofencing Accuracy**, and **Data Integrity**. Since the app relies on browser-based storage (IndexedDB), testing must cover cross-session persistence and edge cases related to storage limits.

### Testing Objectives:
*   Verify offline functionality and data persistence.
*   Ensure geofencing logic correctly blocks attendance outside the 300m radius.
*   Validate all data entry constraints (10-digit phone numbers, non-zero prices).
*   Confirm cross-browser compatibility (Chrome, Safari, Brave).

---

## 2. Test Scenarios & Cases

### 🟢 Scenario 1: User Onboarding & Settings
| ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC1.1 | Map store location in Settings | GPS coordinates are captured and "Save Settings" persists them. |
| TC1.2 | Upload profile photo | Image is displayed in the header and settings page. |
| TC1.3 | Toggle Dark/Light mode | UI colors update immediately and persist after refresh. |
| TC1.4 | Invalid Gemini API Key | App displays a warning if the key doesn't start with "AIza". |

### 🟢 Scenario 2: Attendance & Geofencing
| ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC2.1 | Mark Present (Within 300m) | Attendance marked successfully; map shows current location; calendar turns green. |
| TC2.2 | Mark Present (Outside 300m) | Error message: "Can't mark attendance! You are not in store yet." |
| TC2.3 | Mark Present (No Store Mapped) | Error message directing user to map store in Settings first. |
| TC2.4 | Mark Week Off / Leave | Status updates without GPS check; calendar color changes accordingly. |

### 🟢 Scenario 3: Sales Entry
| ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC3.1 | Add sale with 0 price | Validation error: "Please enter a valid price greater than 0." |
| TC3.2 | Add sale with 10-digit phone | Input accepts exactly 10 digits; prevents 11th digit. |
| TC3.3 | Add sale with bill image | Image preview appears; sale appears in "Recent Entries" with "Bill Attached" badge. |
| TC3.4 | Product Search | Typing "Mixer" filters the product list correctly. |

### 🟢 Scenario 4: Targets & Performance
| ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC4.1 | Enter Weekly Target | Daily Target is automatically populated with (Weekly / 7). |
| TC4.2 | Progress Bar Color | Bar is Orange at 10%, Blue at 60%, and Emerald at 100%+. |
| TC4.3 | Share WhatsApp Report | WhatsApp opens with a correctly formatted text summary of targets. |

### 🟢 Scenario 5: Data Portability
| ID | Test Case | Expected Result |
| :--- | :--- | :--- |
| TC5.1 | Export Data | A `.json` file is downloaded containing all sales, attendance, and settings. |
| TC5.2 | Import Data | Application clears current state and populates with data from the uploaded JSON. |
| TC5.3 | Generate PDF | A PDF report is generated with correct totals for the selected date range. |

---

## 3. Automatable Test Cases (Playwright/Cypress)

These cases are high-priority for automation to prevent regressions in core business logic.

### 🤖 Automation Script: Core Flow
```javascript
// Example Playwright Logic
test('Complete Sales Flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="empId"]', 'EMP001');
  await page.click('button:has-text("Sign In")');

  // 2. Add Sale
  await page.click('nav >> text=New Entry');
  await page.fill('input[placeholder="Search products..."]', 'Bajaj Mixer');
  await page.fill('input[name="price"]', '5000');
  await page.fill('input[name="quantity"]', '2');
  await page.click('button:has-text("Save Sale")');

  // 3. Verify Dashboard
  await page.click('nav >> text=Dashboard');
  const mtdValue = await page.locator('text=₹10,000').isVisible();
  expect(mtdValue).toBe(true);
});
```

### 🤖 Automation Script: Geofencing Mock
```javascript
test('Attendance Geofencing Block', async ({ page, context }) => {
  // Mock location to be far away from store
  await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 }); 
  
  await page.goto('/attendance');
  await page.click('button:has-text("Mark Present")');
  
  const toast = await page.locator('text=not in store yet').isVisible();
  expect(toast).toBe(true);
});
```

---

## 4. Test Data Requirements
*   **Valid API Key**: For testing CRM AI features.
*   **Sample JSON Backup**: For verifying the import/export functionality.
*   **Mock GPS Coordinates**: For testing geofencing boundaries (300m).
*   **Image Assets**: JPG/PNG files under 2MB for bill uploads.
