const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Some catches are just "catch {" followed by use of "e."
    // Let's replace "catch {" to "catch (e: any) {" everywhere.
    // Assuming some places don't use 'e', it's still syntactically valid in TS to catch (e: any).
    content = content.replace(/catch\s*\{/g, 'catch (e: any) {');
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Fixed', f);
    }
});
