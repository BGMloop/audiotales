# Test multilingual capabilities
Write-Host "Testing Nova's multilingual capabilities..."
Write-Host "=========================================="

$tests = @(
    @{
        lang = "en-US"
        text = "Welcome to our multilingual demo! Let me show you how I can speak in different languages."
    },
    @{
        lang = "es-ES"
        text = "¡Hola! En España disfrutamos de la paella y la siesta. ¡La vida es maravillosa!"
    },
    @{
        lang = "fr-FR"
        text = "À Paris, nous adorons le café et les croissants. C'est la vie en rose!"
    },
    @{
        lang = "de-DE"
        text = "In Deutschland genießen wir Bratwurst und Oktoberfest. Prost!"
    }
)

foreach ($test in $tests) {
    Write-Host "`nTesting language: $($test.lang)"
    Write-Host "Text: $($test.text)"
    
    $body = @{
        text = $test.text
        voiceId = "nova_turbo_multilingual"
        language = $test.lang
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:3001/execute/speak_response' -Method Post -Body $body -ContentType 'application/json'
        Write-Host "✓ Success: $($response.message)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Host "✗ Failed" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host "`nAll tests completed!" 