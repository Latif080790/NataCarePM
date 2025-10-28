# Documentation Organization Guide

This guide explains how to properly organize documentation in the NataCarePM project.

## Directory Structure

The documentation is organized into the following directories:

1. **docs/phase1/** - Phase 1 implementation documentation
2. **docs/phase2/** - Phase 2 implementation documentation
3. **docs/phase3/** - Phase 3 implementation documentation
4. **docs/phase4/** - Phase 4 implementation documentation
5. **docs/security/** - Security-related documentation
6. **docs/testing/** - Testing documentation
7. **docs/general/** - General documentation

## Naming Conventions

1. Use clear, descriptive names for documentation files
2. Use underscores to separate words (e.g., `phase_1_implementation_plan.md`)
3. Prefix files with phase or category when appropriate (e.g., `PHASE_1_`, `SECURITY_`, `TESTING_`)
4. Use present tense for ongoing work and past tense for completed work

## File Organization Rules

1. **Phase-specific documentation** should go in the corresponding phase directory
2. **Security documentation** should go in the security directory
3. **Testing documentation** should go in the testing directory
4. **General project documentation** should go in the general directory

## How to Organize New Documentation

1. Create the markdown file with appropriate naming conventions
2. Place it in the correct directory based on its content
3. Update the README.md file in that directory to include the new document
4. If creating a new category, create a new directory and README.md file

## Automation Script

The `organize-docs.ps1` script can be used to automatically organize documentation files:

```powershell
# Run from the project root directory
powershell -ExecutionPolicy Bypass -File scripts\organize-docs.ps1
```

This script will:
1. Identify files based on naming patterns
2. Move files to appropriate directories
3. Provide feedback on what files were moved

## Best Practices

1. Keep documentation up-to-date with code changes
2. Include a table of contents for longer documents
3. Use consistent formatting across all documentation
4. Include dates and version information when relevant
5. Link to related documents when appropriate