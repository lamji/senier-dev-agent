import fs from 'fs';
import path from 'path';

const MAX_LINES = 300;
const FORBIDDEN_COMPONENTS = ['Card']; // Shadcn Card is forbidden by default
const REQUIRED_FOLDERS = ['sub-components', 'sub-helpers'];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const results = {
        path: filePath,
        errors: [],
        warnings: []
    };

    // 1. Check Line Length
    if (lines.length > MAX_LINES) {
        results.errors.push(`File exceeds ${MAX_LINES} lines (${lines.length} lines). MUST refactor.`);
    }

    // 2. Check Forbidden Components
    FORBIDDEN_COMPONENTS.forEach(comp => {
        const regex = new RegExp(`<${comp}[\\s>]`, 'g');
        if (regex.test(content)) {
            results.errors.push(`Forbidden component <${comp}> used. MUST use native div with custom CSS.`);
        }
    });

    // 3. MVVM: Check for complex logic in JSX (simple heuristic)
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        const hooksCount = (content.match(/use[A-Z][a-zA-Z]+/g) || []).length;
        if (hooksCount > 5 && !filePath.includes('ViewModel') && !filePath.includes('hook')) {
            results.warnings.push(`High hook count (${hooksCount}) in View file. Consider moving logic to a ViewModel/Hook.`);
        }
    }

    return results;
}

function checkDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    const summary = [];

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                summary.push(...checkDirectory(fullPath));
            }
        } else if (/\.(js|jsx|ts|tsx|mjs)$/.test(file)) {
            summary.push(checkFile(fullPath));
        }
    });

    return summary;
}

const targetDir = process.argv[2] || '.';
const results = checkDirectory(targetDir).filter(r => r.errors.length > 0 || r.warnings.length > 0);

if (results.length > 0) {
    console.log('--- PATTERN VALIDATION FAILED ---');
    results.forEach(r => {
        console.log(`\nFile: ${r.path}`);
        r.errors.forEach(e => console.log(`[ERROR] ${e}`));
        r.warnings.forEach(w => console.log(`[WARN] ${w}`));
    });
    process.exit(1);
} else {
    console.log('--- PATTERN VALIDATION PASSED ---');
    process.exit(0);
}
