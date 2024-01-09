'use client';

import { TbCsv } from "react-icons/tb";
import { IoSend } from "react-icons/io5";
import { ImSpinner2 } from "react-icons/im";
import { BlockDisplay } from "./blockDisplay";
import { block, generateNewBlocks } from "./actions";
import { useEffect, useRef, useState } from "react";
import { PythonProvider, usePython } from "react-py";

function processCodeBlocks(blocks: Array<{ [key: string]: string }>) : string {
  function wrapCode (code: string) {
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

  return `old_print = print
def new_print(*args, tag='output', **kwargs):
    old_print('{"tag": "' + tag +'", "content": "', end='')
    old_print(*args, **kwargs)
    old_print('"},', end=' ')
print = new_print
import os
os.environ['MPLBACKEND'] = 'AGG'

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
# plt.figure(figsize=(7.68,5.76))

import pandas as pd
pd.set_option("display.max_columns", 40)
pd.set_option("max_colwidth", 24)
pd.set_option("display.width", 79)

` + wrapInTryCatch(code);
  }
  // Filter out only code blocks and deep copy
  const codeBlocks = JSON.parse(JSON.stringify(blocks.filter(block => block.tag === 'code' && !block.error))) as Array<block>;

  // Process each block except the last one to remove print statements
  for (let i = 0; i < codeBlocks.length - 1; i++) {
    codeBlocks[i].content = codeBlocks[i].content.replace(/^\s*(sns\.|plt\.|print).*/gm, '')
  }

  // Concatenate all blocks into one string
  return wrapCode(codeBlocks.map(block => block.content).join('\n'));
}


export default function Home() {

  const [file, setFile] = useState<File | null>(null)
  const [instruction, setInstruction] = useState('')
  const [blocks, setBlocks] = useState<Array<block>>([])
  const [isRunning, setIsRunning] = useState(false)
  const blocksEndRef = useRef<null | HTMLDivElement>(null);
  const { runPython, stdout, isReady, writeFile } = usePython({
    packages: {
      official: ['pandas', 'matplotlib', 'scikit-learn'],
      micropip: ['seaborn']
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null
    setFile(selectedFile)
  };

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstruction(e.target.value)
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (blocks.length > 0) {
      setBlocks((prev) => [
        ...prev,
        {
          content: instruction,
          tag: 'instruction',
          id: crypto.randomUUID()
        }
      ])
    } else {
      if (!file) {
        alert('Upload a CSV')
        return
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target!.result as string;
        
        writeFile(file!.name, content);
      };
      reader.readAsText(file!);
      setBlocks((prev) => [
        ...prev,
        {
          content: file!.name,
          tag: 'file',
          id: crypto.randomUUID()
        },
        {
          content: instruction,
          tag: 'instruction',
          id: crypto.randomUUID()
        }
      ])
    }
    setInstruction('')
    setIsRunning(true)
  }

  const scrollToBottom = () => {
    blocksEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handles blocks changes, dispatches generation and execution
  useEffect(() => {
    scrollToBottom()
    if (blocks.length > 0){
      const lastTag = blocks[blocks.length - 1].tag
      if (lastTag === 'instruction' || lastTag === 'output') {
        console.log('Running completion...')
        const updateBlocks = async () => {
          const newBlocks = await generateNewBlocks(blocks)
          if (newBlocks.length > 0) {
            setBlocks((prev) => [
              ...prev,
              ...newBlocks,
            ])
          } else {
            setIsRunning(false)
          }
        }
        updateBlocks()
      } else if (lastTag === 'code') {
        console.log('Running code...')
        runPython(processCodeBlocks(blocks))
      } else {
        setIsRunning(false)
      }
    }
  }, [blocks])

  // Handles stdout, when execution is finished, updates blocks
  useEffect(() => {
    if (stdout.endsWith(', ')) {
      try {
        const output: Array<{ [key: string]: string }> = JSON.parse('[' + stdout.replace(/\n/g, "\\n").slice(0, -2) + ']');
        const last = output.pop()!;
        if (last.tag == 'end') {
          setBlocks((prev) => {return [
            ...prev, ...output.map((block) => {
              block.id = crypto.randomUUID();
              block.content = block.content.replace(/\\n/g, "\n")
              return block as block
            })
          ]})
        }
        if (last.tag == 'error') {
          setBlocks((prev) => {
            const updatedBlocks = prev.map((block, index) => {
              // If it's the last block, update its 'error' key
              if (index === blocks.length - 1) {
                return { ...block, error: '1' };
              }
              return block as block
            });
            return [
            ...updatedBlocks, ...output.map((block) => {
              block.id = crypto.randomUUID();
              block.content = block.content.replace(/\\n/g, "\n")
              return block as block
            })
          ]})
        }
      }
      catch {
        0
      }
    }
  }, [stdout])
  
  return (
    <PythonProvider>
      <main className='flex flex-col h-screen max-w-3xl mx-auto'>
        <div className="flex-1 overflow-y-auto">
          <BlockDisplay blocks={blocks} />
          <div ref={blocksEndRef} />
        </div>
        {blocks.length > 0 && <button className="border w-24 p-1 rounded-full self-end" onClick={() => setBlocks([])}>Clear chat</button>}
          <form className="flex content-between justify-between my-2 px-2 gap-2 border rounded-full items-center" onSubmit={handleSubmit}>
            {blocks.length === 0 && <>
              <input
                type="file"
                name="file"
                id="file"
                accept=".csv"
                onChange={handleFileChange}
                hidden
              />
              <label htmlFor="file" className="flex items-center justify-center w-12 h-12 rounded-full border hover:cursor-pointer"><TbCsv size={25}/></label>
            </>}

            <textarea
              name="instruction"
              onChange={handleInstructionChange}
              value={instruction}
              className="p-2 h-16 flex-1 bg-inherit focus:border-none focus:outline-none focus:ring-0"
              placeholder="Type your message..." />
            {isRunning || !isReady ? (
              <ImSpinner2 className='mr-1 animate-spin' size={25}/>
            ) : (
              <button type="submit" className="mr-1" disabled={isRunning || !isReady}><IoSend size={25}/></button>
            )}
          </form>
      </main>
    </PythonProvider>
  )
}
