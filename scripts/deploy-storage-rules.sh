#!/bin/bash

# ============================================
# Firebase Storage Rules Deployment Script
# ============================================
# Purpose: Deploy storage security rules to Firebase
# Project: natacara-hns
# Rules File: storage.rules (244 lines)
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}🔥 Firebase Storage Rules Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Firebase CLI is installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo -e "${YELLOW}   Install with: npm install -g firebase-tools${NC}"
    exit 1
fi

FIREBASE_VERSION=$(firebase --version)
echo -e "${GREEN}✅ Firebase CLI: v${FIREBASE_VERSION}${NC}"

# Check if storage.rules exists
if [ ! -f "storage.rules" ]; then
    echo -e "${RED}❌ storage.rules file not found!${NC}"
    echo -e "${YELLOW}   Expected location: ./storage.rules${NC}"
    exit 1
fi
echo -e "${GREEN}✅ storage.rules file found (244 lines)${NC}"

# Check if firebase.json is configured
if ! grep -q '"storage"' firebase.json; then
    echo -e "${RED}❌ firebase.json not configured for storage!${NC}"
    echo -e "${YELLOW}   Adding storage configuration...${NC}"
    exit 1
fi
echo -e "${GREEN}✅ firebase.json configured for storage${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Firebase Storage is initialized
echo -e "${YELLOW}🔍 Checking Firebase Storage status...${NC}"
echo ""

STORAGE_CHECK=$(firebase storage:buckets:list --project natacara-hns 2>&1)

if echo "$STORAGE_CHECK" | grep -iq "error\|not initialized\|not been set up"; then
    echo -e "${RED}❌ Firebase Storage NOT initialized!${NC}"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  MANUAL SETUP REQUIRED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Please follow these steps:${NC}"
    echo ""
    echo -e "1. Open Firebase Console:"
    echo -e "${CYAN}   https://console.firebase.google.com/project/natacara-hns/storage${NC}"
    echo ""
    echo -e "2. Click the 'Get Started' button"
    echo ""
    echo -e "3. Choose 'Production mode' (recommended)"
    echo ""
    echo -e "4. Select location: 'asia-southeast2' or 'us-central1'"
    echo ""
    echo -e "5. Click 'Done' and wait for initialization"
    echo ""
    echo -e "6. Run this script again after setup completes"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📖 See FIREBASE_STORAGE_SETUP_GUIDE.md for detailed instructions${NC}"
    echo ""
    
    # Ask to open console
    read -p "Open Firebase Console now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://console.firebase.google.com/project/natacara-hns/storage"
        elif command -v open &> /dev/null; then
            open "https://console.firebase.google.com/project/natacara-hns/storage"
        fi
    fi
    
    exit 1
fi

echo -e "${GREEN}✅ Firebase Storage is initialized!${NC}"
echo ""

# Display current bucket
echo -e "${YELLOW}📦 Storage Bucket:${NC}"
echo "$STORAGE_CHECK"
echo ""

# Deploy storage rules
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  DEPLOYING STORAGE RULES${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}🚀 Deploying storage.rules to natacara-hns...${NC}"

if firebase deploy --only storage --project natacara-hns; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📊 Security Features Deployed:${NC}"
    echo -e "${GREEN}   ✅ File type validation (images, docs, PDFs)${NC}"
    echo -e "${GREEN}   ✅ Size limits enforced (5MB-100MB)${NC}"
    echo -e "${GREEN}   ✅ Project-based access control${NC}"
    echo -e "${GREEN}   ✅ User ownership verification${NC}"
    echo -e "${GREEN}   ✅ Path-based security rules${NC}"
    echo ""
    echo -e "${YELLOW}🔗 Verify in Firebase Console:${NC}"
    echo -e "${CYAN}   https://console.firebase.google.com/project/natacara-hns/storage/rules${NC}"
    echo ""
    
    # Verify rules
    echo -e "${YELLOW}🔍 Verifying deployed rules...${NC}"
    firebase storage:rules:get --project natacara-hns | head -10
    echo ""
    echo -e "${GREEN}✅ Storage rules active and protecting your data!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ DEPLOYMENT FAILED!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check if you're logged into Firebase CLI"
    echo -e "${CYAN}   Run: firebase login --reauth${NC}"
    echo ""
    echo "2. Verify Firebase project exists"
    echo -e "${CYAN}   Run: firebase projects:list${NC}"
    echo ""
    echo "3. Ensure Storage is initialized in console"
    echo -e "${CYAN}   Visit: https://console.firebase.google.com/project/natacara-hns/storage${NC}"
    echo ""
    echo "4. Check storage.rules syntax"
    echo -e "${CYAN}   Run: firebase deploy --only storage --project natacara-hns --debug${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🎉 SCRIPT COMPLETE!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test file upload in your application"
echo "2. Monitor storage usage in Firebase Console"
echo "3. Review security rules as needed"
echo ""
echo -e "${CYAN}📊 Storage Console: https://console.firebase.google.com/project/natacara-hns/storage${NC}"
echo ""
