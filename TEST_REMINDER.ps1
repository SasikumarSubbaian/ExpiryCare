# PowerShell script to test the reminder endpoint
# Usage: .\TEST_REMINDER.ps1

Write-Host "Testing Reminder Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Dev server is not running. Please start it with: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Calling /api/reminders endpoint..." -ForegroundColor Cyan
Write-Host ""

try {
    # Use Invoke-WebRequest for PowerShell (curl is an alias but behaves differently)
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/reminders" -Method GET
    
    Write-Host "Response Status:" $response.StatusCode -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Yellow
    Write-Host $response.Content
    
    # Try to parse as JSON
    try {
        $json = $response.Content | ConvertFrom-Json
        Write-Host ""
        Write-Host "Parsed JSON:" -ForegroundColor Yellow
        $json | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Response is not valid JSON" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✓ Endpoint responded successfully" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error calling endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "Possible issues:" -ForegroundColor Yellow
            Write-Host "1. API route doesn't exist at /api/reminders" -ForegroundColor Yellow
            Write-Host "2. Dev server needs to be restarted" -ForegroundColor Yellow
            Write-Host "3. Check if app/api/reminders/route.ts exists" -ForegroundColor Yellow
        }
    }
}

