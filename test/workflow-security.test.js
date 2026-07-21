const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_DIR = path.join(ROOT, '.github', 'workflows');

function workflowFiles() {
    return fs.readdirSync(WORKFLOW_DIR)
        .filter(file => /\.ya?ml$/.test(file))
        .map(file => path.join(WORKFLOW_DIR, file));
}

test('external GitHub Actions are pinned to full commit SHAs', () => {
    for (const file of workflowFiles()) {
        const workflow = fs.readFileSync(file, 'utf8');
        const references = [...workflow.matchAll(/^\s*uses:\s+([^\s#]+)/gm)];

        for (const [, reference] of references) {
            if (reference.startsWith('./')) continue;
            const separator = reference.lastIndexOf('@');
            assert.notEqual(separator, -1, `${file}: action reference is missing a revision`);
            assert.match(
                reference.slice(separator + 1),
                /^[0-9a-f]{40}$/,
                `${file}: ${reference} must use a full commit SHA`
            );
        }
    }
});

test('workflow checkouts do not persist credentials', () => {
    for (const file of workflowFiles()) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');

        lines.forEach((line, index) => {
            if (!line.includes('uses: actions/checkout@')) return;
            const checkoutBlock = lines.slice(index, index + 6).join('\n');
            assert.match(
                checkoutBlock,
                /^\s+persist-credentials:\s+false$/m,
                `${file}: checkout must disable credential persistence`
            );
        });
    }
});

test('CI jobs receive read-only repository contents permission', () => {
    const workflow = fs.readFileSync(path.join(WORKFLOW_DIR, 'ci.yml'), 'utf8');
    assert.match(workflow, /^permissions:\n {2}contents: read$/m);
});
