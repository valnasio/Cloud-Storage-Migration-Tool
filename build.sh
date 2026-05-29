echo "📦 Gerando executáveis..."

# Linux
npx pkg dist/index.js \
  --targets node18-linux-x64 \
  --output cloud-migrator-linux \
  --compress GZip

# Windows
npx pkg dist/index.js \
  --targets node18-win-x64 \
  --output cloud-migrator-win \
  --compress GZip

echo ""
echo "✅ Executáveis gerados:"
echo "   Linux:   ./cloud-migrator-linux"
echo "   Windows: ./cloud-migrator-win.exe"