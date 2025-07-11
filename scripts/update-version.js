#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Version Update Script for Numbering Plan Management System
 * 
 * Usage:
 *   node scripts/update-version.js <new-version> [release-date]
 * 
 * Examples:
 *   node scripts/update-version.js 1.1.0
 *   node scripts/update-version.js 1.1.0 2024-02-15
 */

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node scripts/update-version.js <new-version> [release-date]');
    console.log('Example: node scripts/update-version.js 1.1.0 2024-02-15');
    process.exit(1);
}

const newVersion = args[0];
const releaseDate = args[1] || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Validate version format (semantic versioning)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
    console.error('Error: Version must be in semantic versioning format (e.g., 1.1.0)');
    process.exit(1);
}

console.log(`Updating to version ${newVersion} with release date ${releaseDate}`);

// Update package.json
function updatePackageJson() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log(`Current version: ${package.version}`);
    console.log(`New version: ${newVersion}`);
    
    package.version = newVersion;
    
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
    console.log('✅ Updated package.json');
}

// Update CHANGELOG.md
function updateChangelog() {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    let changelog = fs.readFileSync(changelogPath, 'utf8');
    
    // Find the [Unreleased] section
    const unreleasedIndex = changelog.indexOf('## [Unreleased]');
    if (unreleasedIndex === -1) {
        console.error('Error: Could not find [Unreleased] section in CHANGELOG.md');
        process.exit(1);
    }
    
    // Find the end of the [Unreleased] section (before the next ##)
    const nextSectionIndex = changelog.indexOf('\n## ', unreleasedIndex + 1);
    const unreleasedEndIndex = nextSectionIndex !== -1 ? nextSectionIndex : changelog.length;
    
    // Extract unreleased content
    const unreleasedContent = changelog.substring(unreleasedIndex, unreleasedEndIndex);
    
    // Check if there are any changes in the unreleased section
    const hasChanges = unreleasedContent.includes('### Added') || 
                      unreleasedContent.includes('### Changed') || 
                      unreleasedContent.includes('### Fixed') || 
                      unreleasedContent.includes('### Removed') || 
                      unreleasedContent.includes('### Security');
    
    if (!hasChanges) {
        console.log('⚠️  Warning: No changes found in [Unreleased] section');
        console.log('   Consider adding changes before releasing a new version');
    }
    
    // Create new version section
    const newVersionSection = `## [${newVersion}] - ${releaseDate}

${unreleasedContent.replace('## [Unreleased]', '').trim()}

`;
    
    // Replace [Unreleased] with the new version section
    const beforeUnreleased = changelog.substring(0, unreleasedIndex);
    const afterUnreleased = changelog.substring(unreleasedEndIndex);
    
    changelog = beforeUnreleased + newVersionSection + afterUnreleased;
    
    fs.writeFileSync(changelogPath, changelog);
    console.log('✅ Updated CHANGELOG.md');
}

// Update README.md current version reference
function updateReadme() {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readme = fs.readFileSync(readmePath, 'utf8');
    
    // Update the current version reference
    readme = readme.replace(
        /### Current Version: \d+\.\d+\.\d+/,
        `### Current Version: ${newVersion}`
    );
    
    fs.writeFileSync(readmePath, readme);
    console.log('✅ Updated README.md');
}

// Main execution
try {
    updatePackageJson();
    updateChangelog();
    updateReadme();
    
    console.log('\n🎉 Version update completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the changes in CHANGELOG.md');
    console.log('2. Commit your changes: git add . && git commit -m "Release version ${newVersion}"');
    console.log('3. Create a git tag: git tag -a v${newVersion} -m "Version ${newVersion}"');
    console.log('4. Push changes: git push && git push --tags');
    
} catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
} 