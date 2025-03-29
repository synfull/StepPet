#!/bin/bash

# Create fonts directory if it doesn't exist
mkdir -p assets/fonts

# Download Caprasimo Regular
curl -L "https://fonts.googleapis.com/css2?family=Caprasimo&display=swap" -o caprasimo.css
CAPRASIMO_URL=$(grep -o 'https://[^)]*' caprasimo.css | head -n 1)
curl -L "$CAPRASIMO_URL" -o "assets/fonts/Caprasimo-Regular.ttf"
rm caprasimo.css

# Download Montserrat fonts from GitHub
curl -L "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf" -o "assets/fonts/Montserrat-Regular.ttf"
curl -L "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Medium.ttf" -o "assets/fonts/Montserrat-Medium.ttf"
curl -L "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-SemiBold.ttf" -o "assets/fonts/Montserrat-SemiBold.ttf"
curl -L "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf" -o "assets/fonts/Montserrat-Bold.ttf"

echo "Fonts downloaded successfully!" 