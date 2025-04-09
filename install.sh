#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    sudo apt update
    sudo apt install -y nodejs npm
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate icons
echo "Generating icons..."
npm run generate-icons

# Create a zip file for distribution
echo "Creating distribution package..."
zip -r sirtech-whatsapp.zip manifest.json popup.html popup.js background.js content.js icons/

echo "Installation complete!"
echo "To load the extension in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the extension directory"
echo ""
echo "Or use the generated sirtech-whatsapp.zip file for distribution." 