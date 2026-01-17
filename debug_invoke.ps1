try {
    $headers = @{ Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bHhqYWt3b2VrYmlvd252bWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5NzU2OSwiZXhwIjoyMDc5MTczNTY5fQ.s4_-xdYQ9UnEqj4W1qs6FgBaxBY-sFvvQMPwclmMcAI" }
    Invoke-RestMethod -Uri "https://oxlxjakwoekbiownvmhv.supabase.co/functions/v1/setup-stripe-plans" -Method Post -Headers $headers -Body "{}" -ContentType "application/json"
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
}
