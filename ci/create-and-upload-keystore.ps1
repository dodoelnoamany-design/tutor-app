# Creates an Android keystore, base64-encodes it, and uploads secrets to GitHub
# Run from the repository root in PowerShell after installing and authenticating `gh`.

$repo = 'dodoelnoamany-design/tutor-app'
$alias = 'tutormaster'

Write-Output 'Generating secure passwords (keystore & key)...'
$randBytes = New-Object 'System.Byte[]' 24; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($randBytes)
$storepass = ([Convert]::ToBase64String($randBytes)) -replace '[+/=]','A'
$storepass = $storepass.Substring(0,16)
$randBytes2 = New-Object 'System.Byte[]' 24; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($randBytes2)
$keypass = ([Convert]::ToBase64String($randBytes2)) -replace '[+/=]','B'
$keypass = $keypass.Substring(0,16)

if (Test-Path release.keystore) { Remove-Item release.keystore -Force }

Write-Output 'Creating keystore (release.keystore)...'
$keytoolArgs = @('-genkeypair','-v', '-keystore','release.keystore', '-alias',$alias, '-keyalg','RSA','-keysize','2048','-validity','10000','-storetype','PKCS12', '-storepass',$storepass, '-keypass',$keypass, '-dname', 'CN=TutorMaster, OU=Dev, O=TutorMaster, L=City, ST=State, C=US')
& keytool @keytoolArgs

if (-not (Test-Path release.keystore)) {
    Write-Error 'Keystore creation failed.'; exit 1
}

Write-Output 'Encoding keystore to base64...'
[System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes('release.keystore')) | Out-File -Encoding ascii release.keystore.b64

Write-Output 'Checking gh authentication...'
& gh auth status > $null 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error 'gh is not authenticated. Run "gh auth login" and retry.'; exit 2 }

Write-Output 'Uploading secrets to GitHub (will not print secret values)...'
$keystoreB64 = Get-Content release.keystore.b64 -Raw
gh secret set ANDROID_KEYSTORE --body "$keystoreB64" --repo $repo
gh secret set KEYSTORE_PASSWORD --body $storepass --repo $repo
gh secret set KEY_ALIAS --body $alias --repo $repo
gh secret set KEY_PASSWORD --body $keypass --repo $repo

if (-not (Test-Path ci)) { New-Item -ItemType Directory -Path ci | Out-Null }
"Keystore created: release.keystore (base64 saved to release.keystore.b64)" | Out-File -FilePath ci/keystore-info.txt -Encoding ascii

Write-Output 'All done — keystore created and secrets uploaded.'