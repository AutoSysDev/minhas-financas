$headers = @{
    Authorization = "Bearer sbp_a1e9d11945aed84caf92f198a54dac65ab791f9f"
}
$response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/oxlxjakwoekbiownvmhv/api-keys" -Headers $headers -Method Get
$serviceRole = $response | Where-Object { $_.name -eq "service_role" }
$serviceRole.api_key | Out-File -FilePath key.txt -Encoding ascii -NoNewline
