#!/bin/bash

# Test Coverage Report Generator (Unix/Linux/Mac)

echo "🧪 Running tests with coverage..."

# Run tests with coverage
npm run test:coverage

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

echo ""
echo "✅ Tests passed!"

# Check if coverage directory exists
if [ -f "coverage/coverage-summary.json" ]; then
    echo ""
    echo "📊 Coverage Summary:"
    
    # Extract coverage percentages
    LINES=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    STATEMENTS=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
    FUNCTIONS=$(cat coverage/coverage-summary.json | jq '.total.functions.pct')
    BRANCHES=$(cat coverage/coverage-summary.json | jq '.total.branches.pct')
    
    echo "  Lines:      ${LINES}%"
    echo "  Statements: ${STATEMENTS}%"
    echo "  Functions:  ${FUNCTIONS}%"
    echo "  Branches:   ${BRANCHES}%"
    
    echo ""
    
    # Check if meets threshold
    if (( $(echo "$LINES < 60" | bc -l) )); then
        echo "⚠️  Coverage is below 60% threshold!"
        echo "   Current: ${LINES}%"
        echo "   Target:  60%"
    else
        echo "✅ Coverage meets 60% threshold!"
    fi
    
    echo ""
    echo "📁 HTML Report: coverage/index.html"
    echo "📁 LCOV Report: coverage/lcov.info"
else
    echo "❌ Coverage summary not found!"
fi
