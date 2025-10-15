# fix_project.ps1
# Run from backend folder. Ensure you're using Node v20 (nvm use 20).
Write-Host "Running project fix script..."

# 1) Update package.json (backup first)
$pkg = Join-Path (Get-Location) 'package.json'
Copy-Item $pkg "$pkg.bak" -Force
Write-Host "Backed up package.json to package.json.bak"

# Replace package.json content (safe overwrite)
$packageContent = @'
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Visual Product Matcher - backend",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "generate": "node utils/generateEmbeddings.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@tensorflow-models/mobilenet": "^2.1.1",
    "@tensorflow/tfjs-node": "^4.22.0",
    "axios": "^1.12.2",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "multer": "^2.0.2"
  }
}
'@
Set-Content -Path $pkg -Value $packageContent -Force -Encoding UTF8
Write-Host "package.json overwritten with recommended config."

# 2) Remove node_modules and package-lock.json
if (Test-Path .\node_modules) {
  Write-Host "Removing node_modules..."
  Remove-Item -Recurse -Force .\node_modules
}
if (Test-Path .\package-lock.json) {
  Remove-Item -Force .\package-lock.json
  Write-Host "Deleted package-lock.json"
}

# 3) Reinstall dependencies
Write-Host "Installing dependencies (this can take a few minutes)..."
npm install

# 4) Run embedding generation (if products images exist)
Write-Host "Running embedding generation (npm run generate)..."
npm run generate

Write-Host "Done. If embedding generation fails, check errors above and consider switching Node version to v20."
