# Clear Browser Cache and Storage - Troubleshooting Script
# Run this if you're experiencing persistent errors after deployment

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Clear Cache & Storage Instructions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Hard Refresh Browser" -ForegroundColor Yellow
Write-Host "  Windows: Ctrl + Shift + R" -ForegroundColor White
Write-Host "  Mac: Cmd + Shift + R" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Clear All Site Data" -ForegroundColor Yellow
Write-Host "  1. Open DevTools (F12)" -ForegroundColor White
Write-Host "  2. Go to Application tab" -ForegroundColor White
Write-Host "  3. Click 'Clear storage' in left sidebar" -ForegroundColor White
Write-Host "  4. Check all boxes:" -ForegroundColor White
Write-Host "     - Local storage" -ForegroundColor Gray
Write-Host "     - Session storage" -ForegroundColor Gray
Write-Host "     - IndexedDB" -ForegroundColor Gray
Write-Host "     - Cookies" -ForegroundColor Gray
Write-Host "     - Cache storage" -ForegroundColor Gray
Write-Host "  5. Click 'Clear site data' button" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Unregister Service Workers" -ForegroundColor Yellow
Write-Host "  1. Still in Application tab" -ForegroundColor White
Write-Host "  2. Click 'Service Workers' in left sidebar" -ForegroundColor White
Write-Host "  3. Click 'Unregister' for any active workers" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Close and Reopen Browser" -ForegroundColor Yellow
Write-Host "  Completely close browser (all tabs)" -ForegroundColor White
Write-Host "  Wait 5 seconds" -ForegroundColor White
Write-Host "  Open fresh browser window" -ForegroundColor White
Write-Host ""

Write-Host "STEP 5: Test in Incognito Mode" -ForegroundColor Yellow
Write-Host "  Windows: Ctrl + Shift + N" -ForegroundColor White
Write-Host "  Mac: Cmd + Shift + N" -ForegroundColor White
Write-Host "  Navigate to: https://natacara-hns.web.app/login" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Common Issues & Solutions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Issue: 'Missing or insufficient permissions'" -ForegroundColor Red
Write-Host "Solution:" -ForegroundColor Green
Write-Host "  - Firestore rules just updated (may take 1-2 minutes)" -ForegroundColor White
Write-Host "  - Wait 2 minutes, then hard refresh" -ForegroundColor White
Write-Host "  - Clear IndexedDB (Firestore cache)" -ForegroundColor White
Write-Host ""

Write-Host "Issue: 'removeChild' or DOM errors" -ForegroundColor Red
Write-Host "Solution:" -ForegroundColor Green
Write-Host "  - React strict mode race condition" -ForegroundColor White
Write-Host "  - Usually harmless in production" -ForegroundColor White
Write-Host "  - Can be ignored if app works" -ForegroundColor White
Write-Host ""

Write-Host "Issue: Infinite loading spinner" -ForegroundColor Red
Write-Host "Solution:" -ForegroundColor Green
Write-Host "  - Check Network tab for failed requests" -ForegroundColor White
Write-Host "  - Verify Firebase Authentication is working" -ForegroundColor White
Write-Host "  - Check Console for specific errors" -ForegroundColor White
Write-Host ""

Write-Host "Issue: 'Failed to execute removeChild'" -ForegroundColor Red
Write-Host "Solution:" -ForegroundColor Green
Write-Host "  - Clear service worker cache" -ForegroundColor White
Write-Host "  - Unregister all service workers" -ForegroundColor White
Write-Host "  - Test in incognito mode" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Verification Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After clearing cache, verify:" -ForegroundColor Yellow
Write-Host "  1. No errors in Console tab" -ForegroundColor White
Write-Host "  2. Network requests succeed (200 status)" -ForegroundColor White
Write-Host "  3. Can see login page" -ForegroundColor White
Write-Host "  4. Can login successfully" -ForegroundColor White
Write-Host "  5. Can access dashboard" -ForegroundColor White
Write-Host ""

Write-Host "If still having issues:" -ForegroundColor Yellow
Write-Host "  Take screenshot of Console errors" -ForegroundColor White
Write-Host "  Check Network tab for failed requests" -ForegroundColor White
Write-Host "  Share error details for further debugging" -ForegroundColor White
Write-Host ""

Write-Host "Current Firestore Rules Status:" -ForegroundColor Cyan
Write-Host "  Deployed: firestore.rules.balanced" -ForegroundColor Green
Write-Host "  Security: Moderate (all authenticated users)" -ForegroundColor Yellow
Write-Host "  Updated: Just now" -ForegroundColor Green
Write-Host ""
