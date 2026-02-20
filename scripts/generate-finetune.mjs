/**
 * Senior Dev Mind — Advanced Dataset Generator
 * Parses all rules, workflows, and memory into a granular JSONL format.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, basename, extname } from 'path';

const BASE_DIR = resolve('.agent');
const OUTPUT_FILE = resolve('.agent/finetune-draft.jsonl');

function splitBySection(content) {
    const lines = content.split('\n');
    const sections = [];
    let currentTitle = '';
    let currentContent = [];

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentContent.length > 0) {
                sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
            }
            currentTitle = line.replace('## ', '').trim();
            currentContent = [];
        } else if (line.startsWith('# ')) {
            // Document title, skip or use as context
        } else {
            currentContent.push(line);
        }
    }
    if (currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
    }
    return sections;
}

async function generate() {
    console.log('🏗️  Step 1: Auditing files for the Senior Dev Mind...');
    const examples = [];

    const categories = [
        { path: 'rules', instruction: 'Explain the specific rules for ' },
        { path: 'workflows', instruction: 'How do you execute the workflow for ' },
        { path: 'memory', instruction: 'Recall the project knowledge regarding ' }
    ];

    for (const cat of categories) {
        const dirPath = resolve(BASE_DIR, cat.path);
        try {
            const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const content = readFileSync(join(dirPath, file), 'utf-8');
                const title = basename(file, '.md').replace(/-/g, ' ');
                
                // Add full file context
                examples.push({
                    instruction: `${cat.instruction} ${title}`,
                    input: "",
                    output: content
                });

                // Add granular section context
                const sections = splitBySection(content);
                for (const section of sections) {
                    if (section.content.length > 20) {
                        examples.push({
                            instruction: `Senior Dev Knowledge: ${title} - ${section.title}`,
                            input: "",
                            output: section.content
                        });
                    }
                }
            }
        } catch (e) {
            console.log(`⚠️  Skipping missing directory: ${cat.path}`);
        }
    }

    // Special: Correction Mapping
    try {
        const corrections = readFileSync(resolve(BASE_DIR, 'memory/corrections.md'), 'utf-8');
        const items = corrections.split('\n- ').slice(1);
        for (const item of items) {
            examples.push({
                instruction: "Prevent a recurring Senior Dev failure.",
                input: item.split(':')[0],
                output: `To avoid this failure, follow this rule: ${item}`
            });
        }
    } catch (e) {}

    // 4. Identity Audit Specifics
    examples.push({
        instruction: "How do you start every response to the user?",
        input: "",
        output: "I must start every response with a 'Step 0: Identity Audit', summarizing the last 3 logs and last 3 corrections to ensure I am in alignment with the Senior Dev Standard."
    });

    const jsonl = examples.map(ex => JSON.stringify(ex)).join('\n');
    writeFileSync(OUTPUT_FILE, jsonl);
    console.log(`✅ Success! Generated ${examples.length} instruction pairs at ${OUTPUT_FILE}`);
}

generate();
