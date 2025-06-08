# PowerShell script to generate self-signed SSL certificates for development

# Create the ssl directory if it doesn't exist
$sslPath = ".\ssl"
if (-not (Test-Path -Path $sslPath)) {
    New-Item -ItemType Directory -Path $sslPath | Out-Null
    Write-Host "Created SSL directory"
}

# Define certificate parameters
$certName = "localhost"
$keyFile = Join-Path -Path $sslPath -ChildPath "key.pem"
$certFile = Join-Path -Path $sslPath -ChildPath "cert.pem"

# Check if OpenSSL is available
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($openssl) {
    # Generate a self-signed certificate using OpenSSL
    Write-Host "Generating SSL certificate using OpenSSL..."
    & openssl req -x509 -newkey rsa:2048 -keyout $keyFile -out $certFile -days 365 -nodes -subj "/CN=$certName"
    
    if (Test-Path -Path $keyFile -and Test-Path -Path $certFile) {
        Write-Host "SSL certificates generated successfully!"
    } else {
        Write-Host "Failed to generate certificates."
    }
} else {
    # Fallback to using PowerShell's New-SelfSignedCertificate (Windows 10/Server 2016+)
    Write-Host "OpenSSL not found. Trying to use New-SelfSignedCertificate..."
    
    try {
        # Create a self-signed certificate
        $cert = New-SelfSignedCertificate -DnsName $certName -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddDays(365)
        
        # Export the certificate to PFX file (temporary)
        $pfxPassword = ConvertTo-SecureString -String "temppassword" -Force -AsPlainText
        $pfxPath = Join-Path -Path $sslPath -ChildPath "temp.pfx"
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword | Out-Null
        
        # Convert PFX to PEM format (requires OpenSSL)
        if ($openssl) {
            Write-Host "Converting certificate to PEM format..."
            
            # Extract private key
            & openssl pkcs12 -in $pfxPath -nocerts -out $keyFile -nodes -password pass:temppassword
            
            # Extract certificate
            & openssl pkcs12 -in $pfxPath -nokeys -out $certFile -nodes -password pass:temppassword
            
            # Remove the temporary PFX file
            Remove-Item -Path $pfxPath -Force
            
            Write-Host "SSL certificates generated successfully!"
        } else {
            Write-Host "Generated certificate in PFX format, but OpenSSL is required to convert to PEM format."
            Write-Host "Please install OpenSSL to complete the process."
        }
    } catch {
        Write-Host "Failed to generate certificates using PowerShell. Error: $_"
        Write-Host ""
        Write-Host "Manual SSL Certificate Generation Instructions:"
        Write-Host "-----------------------------------------------"
        Write-Host "1. Download and install OpenSSL for Windows from https://slproweb.com/products/Win32OpenSSL.html"
        Write-Host "2. Add OpenSSL to your PATH"
        Write-Host "3. Run the following commands in your terminal:"
        Write-Host "   openssl req -x509 -newkey rsa:2048 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes -subj '/CN=localhost'"
    }
}

Write-Host "Note: These certificates are for development only. Use proper certificates in production."
