#!/bin/bash

# 🔥 Firebase Deployment Script for Linux/Mac
# Run with: bash deploy-firebase-rules.sh

echo "🔥 Firebase Security Rules Deployment"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
echo -e "${YELLOW}Checking Firebase CLI installation...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo ""
    echo -e "${YELLOW}To install Firebase CLI, run:${NC}"
    echo -e "${NC}npm install -g firebase-tools${NC}"
    echo ""
    echo -e "${YELLOW}After installation, run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found: $(firebase --version)${NC}"
echo ""

# Check if user is logged in
echo -e "${YELLOW}Checking Firebase authentication...${NC}"
firebase login:list &> /dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Not logged in to Firebase!${NC}"
    echo ""
    echo -e "${YELLOW}Logging in to Firebase...${NC}"
    firebase login
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Login failed!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Authenticated with Firebase${NC}"
echo ""

# List available projects
echo -e "${YELLOW}Available Firebase projects:${NC}"
firebase projects:list

echo ""
echo -e "${YELLOW}Current project:${NC}"
firebase use

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}📋 Deployment Options:${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${NC}1. Deploy Firestore Rules only${NC}"
echo -e "${NC}2. Deploy Storage Rules only${NC}"
echo -e "${GREEN}3. Deploy Both Rules (Recommended)${NC}"
echo -e "${NC}4. Test Firestore Rules locally${NC}"
echo -e "${NC}5. Exit${NC}"
echo ""

read -p "Select option (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${CYAN}🚀 Deploying Firestore Rules...${NC}"
        firebase deploy --only firestore:rules
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Firestore Rules deployed successfully!${NC}"
            echo ""
            echo -e "${YELLOW}Verifying deployment...${NC}"
            firebase firestore:rules:get
        else
            echo -e "${RED}❌ Deployment failed!${NC}"
        fi
        ;;
    
    2)
        echo ""
        echo -e "${CYAN}🚀 Deploying Storage Rules...${NC}"
        firebase deploy --only storage:rules
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Storage Rules deployed successfully!${NC}"
            echo ""
            echo -e "${YELLOW}Verifying deployment...${NC}"
            firebase storage:rules:get
        else
            echo -e "${RED}❌ Deployment failed!${NC}"
        fi
        ;;
    
    3)
        echo ""
        echo -e "${CYAN}🚀 Deploying All Security Rules...${NC}"
        echo ""
        
        # Deploy Firestore rules
        echo -e "${YELLOW}📦 Deploying Firestore Rules...${NC}"
        firebase deploy --only firestore:rules
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Firestore Rules deployed!${NC}"
        else
            echo -e "${RED}❌ Firestore Rules deployment failed!${NC}"
            exit 1
        fi
        
        echo ""
        
        # Deploy Storage rules
        echo -e "${YELLOW}📦 Deploying Storage Rules...${NC}"
        firebase deploy --only storage:rules
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Storage Rules deployed!${NC}"
        else
            echo -e "${RED}❌ Storage Rules deployment failed!${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ ALL SECURITY RULES DEPLOYED!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        
        # Verify both deployments
        echo -e "${CYAN}📋 Verification:${NC}"
        echo ""
        echo -e "${YELLOW}Firestore Rules:${NC}"
        firebase firestore:rules:get
        echo ""
        echo -e "${YELLOW}Storage Rules:${NC}"
        firebase storage:rules:get
        ;;
    
    4)
        echo ""
        echo -e "${CYAN}🧪 Testing Firestore Rules locally...${NC}"
        echo ""
        echo -e "${YELLOW}Note: You need to set up emulators first with:${NC}"
        echo -e "${NC}firebase init emulators${NC}"
        echo ""
        echo -e "${YELLOW}Then create test files in tests/ directory${NC}"
        echo ""
        firebase emulators:start --only firestore
        ;;
    
    5)
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
        ;;
    
    *)
        echo -e "${RED}❌ Invalid option!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}📊 Next Steps:${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${NC}1. Test the security rules in your app${NC}"
echo -e "${NC}2. Verify unauthorized access is blocked${NC}"
echo -e "${NC}3. Check Firebase Console for rule errors${NC}"
echo -e "${NC}4. Monitor Firebase usage and logs${NC}"
echo ""
echo -e "${CYAN}🔗 Firebase Console:${NC}"
echo -e "${NC}https://console.firebase.google.com${NC}"
echo ""
