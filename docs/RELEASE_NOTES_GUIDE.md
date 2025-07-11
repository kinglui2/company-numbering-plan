# Release Notes Management Guide

This guide explains how to manage release notes and version updates for the Numbering Plan Management System.

## 📋 Overview

We use a structured approach to track changes and releases:

- **CHANGELOG.md**: Main changelog file following [Keep a Changelog](https://keepachangelog.com/) format
- **Semantic Versioning**: Version numbers follow `MAJOR.MINOR.PATCH` format
- **Automated Updates**: Script to help manage version updates

## 🚀 How to Add New Features/Changes

### 1. Document Changes in [Unreleased] Section

When you add new features, fix bugs, or make changes, update the `[Unreleased]` section in `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature: Bulk number assignment
- Export functionality for CSV files

### Fixed
- Bug: Number status not updating correctly
- Issue: Gateway assignment validation

### Changed
- Updated UI layout for better mobile experience
- Improved search performance
```

### 2. Categories to Use

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

## 🔄 How to Release a New Version

### Method 1: Using the Automated Script (Recommended)

1. **Prepare your changes**: Make sure all changes are documented in the `[Unreleased]` section
2. **Run the version update script**:

```bash
# Update to version 1.1.0 with today's date
node scripts/update-version.js 1.1.0

# Or specify a custom date
node scripts/update-version.js 1.1.0 2024-02-15
```

3. **Review the changes**: The script will update:
   - `package.json` version
   - `CHANGELOG.md` (moves [Unreleased] to new version)
   - `README.md` current version reference

4. **Commit and tag**:
```bash
git add .
git commit -m "Release version 1.1.0"
git tag -a v1.1.0 -m "Version 1.1.0"
git push && git push --tags
```

### Method 2: Manual Update

1. **Update package.json**:
```json
{
  "version": "1.1.0"
}
```

2. **Update CHANGELOG.md**:
   - Move content from `[Unreleased]` to `[1.1.0] - 2024-02-15`
   - Add the release date

3. **Update README.md**:
   - Change the current version reference

## 📊 Version Numbering Guidelines

### Semantic Versioning (MAJOR.MINOR.PATCH)

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major new features
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, minor improvements

### Examples

- **1.0.0**: Initial release
- **1.1.0**: Added role-based access control
- **1.1.1**: Fixed authentication bug
- **2.0.0**: Complete UI redesign (breaking changes)

## 📝 Best Practices

### Writing Good Release Notes

1. **Be Clear and Concise**: Use simple language
2. **Group Related Changes**: Use categories (Added, Fixed, etc.)
3. **Include Context**: Explain why changes were made
4. **Reference Issues**: Link to GitHub issues or pull requests
5. **User-Focused**: Explain benefits to end users

### Example Good Entry

```markdown
### Added
- Bulk number assignment feature for administrators
- Export functionality to CSV format
- Advanced search filters for number status

### Fixed
- Authentication timeout issue on mobile devices
- Number status not updating in real-time
- Gateway assignment validation errors

### Changed
- Updated dashboard layout for better mobile experience
- Improved search performance by 40%
- Enhanced error messages for better user feedback
```

### Example Bad Entry

```markdown
### Added
- Stuff
- Things
- More stuff

### Fixed
- Bugs
- Issues
```

## 🔍 Review Process

Before releasing:

1. **Check [Unreleased] section**: Ensure all changes are documented
2. **Test the changes**: Verify new features work correctly
3. **Update documentation**: Make sure README reflects new features
4. **Review with team**: Get feedback on release notes
5. **Run the update script**: Use automated version update
6. **Final review**: Check all files are updated correctly

## 📚 Additional Resources

- [Keep a Changelog](https://keepachangelog.com/): Best practices for changelogs
- [Semantic Versioning](https://semver.org/): Version numbering guidelines
- [Conventional Commits](https://www.conventionalcommits.org/): Commit message guidelines

## 🆘 Troubleshooting

### Common Issues

**Q: The update script fails with "Could not find [Unreleased] section"**
A: Make sure your CHANGELOG.md follows the exact format with `## [Unreleased]`

**Q: No changes are being moved to the new version**
A: Check that you have content under `### Added`, `### Fixed`, etc. in the [Unreleased] section

**Q: Version format error**
A: Use semantic versioning format: `1.1.0`, not `1.1` or `v1.1.0`

### Getting Help

If you encounter issues:
1. Check the script output for error messages
2. Verify file formats and syntax
3. Review the CHANGELOG.md format
4. Ask for help from the development team 