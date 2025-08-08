/**
 * Lovelace Background Animation Package Tag Generator
 * 
 * This script analyzes all packages in the gallery and automatically generates
 * appropriate tags based on the content analysis, particularly focusing on
 * interactive content detection.
 */

const fs = require('fs').promises;
const path = require('path');
const YAML = require('yaml');

// Patterns that typically indicate interactive content
const INTERACTIVE_PATTERNS = [
    // Mouse events
    /addEventListener\s*\(\s*['"`](?:mouse|click|pointer)/i,
    /on(?:mouse|click|pointer)\s*=/i,
    /\.on(?:Mouse|Click|Pointer)/i,
    
    // Touch events
    /addEventListener\s*\(\s*['"`]touch/i,
    /on(?:touch)\s*=/i,
    /\.on(?:Touch)/i,
    
    // Keyboard events
    /addEventListener\s*\(\s*['"`]key/i,
    /on(?:key)\s*=/i,
    /\.on(?:Key)/i,
    
    // Common interactive libraries/classes
    /class\s+Pointer\b/i,
    /new\s+Pointer\b/i,
    /Pointer\s*\(/i,
    
    // Mouse position tracking
    /(?:mouse|cursor|pointer)(?:X|Y|Position)/i,
    /clientX|clientY/i,
    /pageX|pageY/i,
    /offsetX|offsetY/i,
    
    // Touch position tracking
    /touches\[.*?\]\.(?:client|page|offset)/i,
    
    // Canvas interaction
    /getImageData|putImageData/i,
    /canvas.*?(?:mouse|click|touch)/i,
    
    // Common interaction variables
    /uMouse|u_mouse|uniform.*?(?:mouse|cursor|pointer)/i,
    
    // Dragging/movement that typically indicates user interaction
    /drag|dragging|isDragging/i,
    
    // User input handling
    /user.*?input|input.*?user/i,
    
    // Event handling patterns
    /handleClick|handleMouse|handleTouch|handleKey/i,
    /preventDefault\(\)/i,
    /stopPropagation\(\)/i
];

/**
 * Analyzes content for interactive patterns
 */
function analyzeInteractivity(content) {
    const matches = [];
    let score = 0;
    
    INTERACTIVE_PATTERNS.forEach((pattern) => {
        const match = content.match(pattern);
        if (match) {
            matches.push({
                pattern: pattern.toString(),
                match: match[0],
                index: match.index
            });
            score++;
        }
    });
    
    return {
        isInteractive: score > 0,
        confidence: Math.min(score / 3, 1), // Normalize to 0-1, max at 3+ matches
        score,
        matches
    };
}

/**
 * Processes a single package and updates its tags
 */
async function processPackage(packagePath) {
    try {
        const packageFile = path.join(packagePath, 'package.yaml');
        const packageName = path.basename(packagePath);
        
        // Check if package.yaml exists
        try {
            await fs.access(packageFile);
        } catch (err) {
            console.log(`⚠️  No package.yaml found in ${packageName}`);
            return null;
        }
        
        // Read and parse package data
        const fileContent = await fs.readFile(packageFile, 'utf8');
        const packageData = YAML.parse(fileContent);
        
        if (!packageData.metadata) {
            console.log(`⚠️  No metadata found in ${packageName}`);
            return null;
        }
        
        // Analyze the template content for interactivity
        const content = packageData.template || '';
        const analysis = analyzeInteractivity(content);
        
        // Get current tags
        const currentTags = packageData.metadata.tags || [];
        const hasInteractiveTag = currentTags.includes('interactive');
        
        let needsUpdate = false;
        let action = '';
        
        // Determine if we need to update tags
        if (analysis.isInteractive && !hasInteractiveTag) {
            // Add interactive tag
            currentTags.push('interactive');
            packageData.metadata.tags = currentTags;
            needsUpdate = true;
            action = 'Added interactive tag';
        } else if (!analysis.isInteractive && hasInteractiveTag) {
            // Remove interactive tag (only if confidence is high that it's not interactive)
            const filteredTags = currentTags.filter(tag => tag !== 'interactive');
            packageData.metadata.tags = filteredTags;
            needsUpdate = true;
            action = 'Removed interactive tag';
        }
        
        // Update the file if needed
        if (needsUpdate) {
            const updatedYaml = YAML.stringify(packageData);
            await fs.writeFile(packageFile, updatedYaml, 'utf8');
            console.log(`✅ ${packageName}: ${action} (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`);
            
            if (analysis.matches.length > 0) {
                console.log(`   Evidence: ${analysis.matches.slice(0, 2).map(m => m.match).join(', ')}`);
            }
        } else {
            const status = analysis.isInteractive ? '✓ Interactive' : '✓ Non-interactive';
            console.log(`${status} - ${packageName} (no changes needed)`);
        }
        
        return {
            name: packageName,
            wasUpdated: needsUpdate,
            action,
            analysis
        };
        
    } catch (error) {
        console.error(`❌ Error processing ${path.basename(packagePath)}:`, error.message);
        return null;
    }
}

/**
 * Main function to process all packages
 */
async function generateTags() {
    console.log('🏷️  Lovelace Background Animation - Tag Generator');
    console.log('='.repeat(60));
    
    const packagesDir = '../gallery/packages';
    const results = [];
    const summary = {
        total: 0,
        updated: 0,
        addedInteractive: 0,
        removedInteractive: 0,
        errors: 0
    };
    
    try {
        const packages = await fs.readdir(packagesDir);
        
        for (const packageName of packages) {
            const packagePath = path.join(packagesDir, packageName);
            const stats = await fs.stat(packagePath);
            
            if (stats.isDirectory()) {
                const result = await processPackage(packagePath);
                if (result) {
                    results.push(result);
                    summary.total++;
                    
                    if (result.wasUpdated) {
                        summary.updated++;
                        if (result.action.includes('Added')) {
                            summary.addedInteractive++;
                        } else if (result.action.includes('Removed')) {
                            summary.removedInteractive++;
                        }
                    }
                } else {
                    summary.errors++;
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error scanning packages directory:', error);
        return;
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`Total packages processed: ${summary.total}`);
    console.log(`Packages updated: ${summary.updated}`);
    console.log(`Interactive tags added: ${summary.addedInteractive}`);
    console.log(`Interactive tags removed: ${summary.removedInteractive}`);
    console.log(`Errors encountered: ${summary.errors}`);
    
    if (summary.updated > 0) {
        console.log('\n✨ Tag generation completed successfully!');
        console.log('💡 Don\'t forget to commit the changes to your repository.');
    } else {
        console.log('\n✨ All packages are already correctly tagged!');
    }
}

// Run the tag generation
generateTags().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

