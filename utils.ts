
export function extractBlocks(inputString: string, tags: string[] = ['text', 'code']): Array<{ [key: string]: string }> {
  let results: Array<{ [key: string]: string }> = [];

  // Construct a regex pattern that matches any of the specified tags and handles unclosed last tag
  const pattern: RegExp = new RegExp(`<(${tags.join('|')})>([\\s\\S]*?)(<\/\\1>|$)`, 'g');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(inputString)) !== null) {
      const tag: string = match[1];
      const content: string = match[2].trim();
      let block: { [key: string]: string } = {};
      block.tag = tag;
      block.content = content;
      block.id = crypto.randomUUID();
      results.push(block);
  }

  return results;
}

export function blockToString({tag, content}: { [key: string]: string }) {
  return `<${tag}>\n${content}\n</${tag}>`;
}

export function wrapCode (code: string) {
  function wrapInTryCatch(pythonCode: string): string {
    // Splitting the Python code into lines
    const lines = pythonCode.split('\n');

    // Adding indentation to each line
    const indentedPythonCode = lines.map(line => `    ${line}`).join('\n');

    const tryCatchTemplate = `
import traceback
import sys

try:
${indentedPythonCode}
    print('', tag='end')
except Exception as e:
    print(f'Error: {e}')
    print('', tag='error')
`;
    return tryCatchTemplate;
  }

  return `import os
os.environ['MPLBACKEND'] = 'AGG'

import pandas as pd
pd.set_option("display.max_columns", 40)
pd.set_option("max_colwidth", 24)
pd.set_option("display.width", 79)

old_print = print
def new_print(*args, tag='output', **kwargs):
    old_print('{"tag": "' + tag +'", "content": "', end='')
    old_print(*args, **kwargs)
    old_print('"},', end=' ')
print = new_print

import base64
from io import BytesIO

import matplotlib.pyplot as plt

# Patch
def ensure_matplotlib_patch():
  _old_show = plt.show

  def show():
    buf = BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    # Encode to a base64 str
    img = 'data:image/png;base64,' + \
    base64.b64encode(buf.read()).decode('utf-8')
    # Write to stdout
    print(img, tag='img')
    plt.clf()

  plt.show = show

ensure_matplotlib_patch()
plt.figure(figsize=(7.68,5.76))


` + wrapInTryCatch(code);
}


export function processCodeBlocks(blocks: Array<{ [key: string]: string }>) : string {
  // Filter out only code blocks and deep copy
  const codeBlocks = JSON.parse(JSON.stringify(blocks.filter(block => block.tag === 'code' && !block.error))) as Array<{ [key: string]: string }>;

  // Process each block except the last one to remove print statements
  for (let i = 0; i < codeBlocks.length - 1; i++) {
      codeBlocks[i].content = codeBlocks[i].content.replace(/print\(.*\);?\s*/g, '');
  }

  // Concatenate all blocks into one string
  return wrapCode(codeBlocks.map(block => block.content).join('\n'));
}
