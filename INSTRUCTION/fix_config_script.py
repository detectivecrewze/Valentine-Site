#!/usr/bin/env python3
"""
Auto-fix script untuk CONFIG property conflict
Author: Claude AI
Date: 2026-02-05
"""

import re
import sys
from pathlib import Path

def fix_script_js(input_file, output_file):
    """
    Fix script.js dengan mengganti bagian Object.defineProperty
    dan semua akses CONFIG dengan safeGetConfig/safeSetConfig
    """
    
    print("🔧 Starting CONFIG fix...")
    print(f"📄 Reading: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"📊 Original file: {len(content)} characters, {content.count(chr(10))} lines")
    
    # Step 1: Replace the problematic Object.defineProperty block (lines 1-24)
    header_replacement = '''// ============================================================
// 🔧 FIXED: Core Architecture - Reactive CONFIG System
// ============================================================
// This fix prevents "Cannot redefine property: CONFIG" error
// when data.js already declares "const CONFIG = { ... }"

// Store original CONFIG if it exists (from data.js)
const ORIGINAL_CONFIG = typeof CONFIG !== 'undefined' ? { ...CONFIG } : {};

// Create reactive storage for CONFIG updates
if (!window._CONFIG_DATA) {
    window._CONFIG_DATA = null;
}

/**
 * Safe getter for CONFIG - works regardless of property definition
 * Priority: _CONFIG_DATA (from API) > window.CONFIG (from data.js) > ORIGINAL_CONFIG (backup)
 */
function safeGetConfig() {
    return window._CONFIG_DATA || window.CONFIG || ORIGINAL_CONFIG;
}

/**
 * Safe setter for CONFIG - updates internal storage and dispatches events
 */
function safeSetConfig(value) {
    window._CONFIG_DATA = value;
    console.log('[CONFIG] ✅ Global CONFIG updated reactively');
    
    // Dispatch custom event for reactivity
    if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('config-updated', {
            detail: { config: value }
        }));
    }
}

// Initialize with original CONFIG if available
if (ORIGINAL_CONFIG && Object.keys(ORIGINAL_CONFIG).length > 0) {
    console.log('[CONFIG] Initializing with ORIGINAL_CONFIG from data.js');
    safeSetConfig(ORIGINAL_CONFIG);
}
'''
    
    # Find and replace the problematic section
    # Pattern: dari "// Core Architecture" sampai "let isNavigating = false;"
    pattern = r'// Core Architecture.*?let isNavigating = false;.*?\n'
    
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, header_replacement + '\nlet isNavigating = false;\n', content, count=1, flags=re.DOTALL)
        print("✅ Replaced Object.defineProperty block")
    else:
        print("⚠️  Could not find exact pattern, prepending header instead")
        content = header_replacement + '\n\n' + content
    
    # Step 2: Replace all direct CONFIG accesses
    replacements = [
        # Return statements
        (r'return typeof CONFIG !== [\'"]undefined[\'"] \? CONFIG : null;?', 
         'return safeGetConfig();'),
        
        # If conditions
        (r'if \(typeof CONFIG !== [\'"]undefined[\'"] && CONFIG\)', 
         'if (safeGetConfig() && Object.keys(safeGetConfig()).length > 0)'),
        
        # Direct assignments to window.CONFIG
        (r'window\.CONFIG = config;', 
         'safeSetConfig(config);'),
        
        (r'window\.CONFIG = CONFIG;', 
         'safeSetConfig(CONFIG);'),
        
        # Const declarations that reassign
        (r'const CONFIG = window\.CONFIG \|\| window\._CONFIG_DATA;', 
         'const CONFIG = safeGetConfig();'),
        
        (r'const CONFIG = window\.CONFIG;',
         'const CONFIG = safeGetConfig();'),
    ]
    
    replacement_count = 0
    for pattern, replacement in replacements:
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            replacement_count += matches
            print(f"✅ Replaced {matches}x: {pattern[:50]}...")
    
    print(f"📝 Total replacements: {replacement_count}")
    
    # Step 3: Write to output
    print(f"💾 Writing to: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed file: {len(content)} characters, {content.count(chr(10))} lines")
    print("🎉 Done! Please test the fixed file.")
    
    return True

def main():
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else 'script-fixed.js'
    else:
        input_file = '/mnt/user-data/uploads/script.js'
        output_file = '/home/claude/script-fixed.js'
    
    try:
        fix_script_js(input_file, output_file)
        print("\n📋 Next steps:")
        print("1. Review the fixed file")
        print("2. Backup your original script.js")
        print("3. Replace script.js with the fixed version")
        print("4. Test in browser")
        print("5. Check console for any errors")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
