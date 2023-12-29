
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
except Exception as e:
    print(f'Error: {e}')
finally:
    print('END OF EXECUTION')
`;
    return tryCatchTemplate;
  }

  return `import pandas as pd
pd.set_option("display.max_columns", 40)
pd.set_option("max_colwidth", 24)
pd.set_option("display.width", 79)
` + wrapInTryCatch(code);
}


export function processCodeBlocks(blocks: Array<{ [key: string]: string }>) : string {
  // Filter out only code blocks and deep copy
  const codeBlocks = JSON.parse(JSON.stringify(blocks.filter(block => block.tag === 'code'))) as Array<{ [key: string]: string }>;

  // Process each block except the last one to remove print statements
  for (let i = 0; i < codeBlocks.length - 1; i++) {
      codeBlocks[i].content = codeBlocks[i].content.replace(/print\(.*\);?\s*/g, '');
  }

  // Concatenate all blocks into one string
  return wrapCode(codeBlocks.map(block => block.content).join('\n'));
}
