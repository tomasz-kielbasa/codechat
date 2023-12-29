'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import React, {useState, useEffect, useRef} from "react";
import { useCompletion } from "ai/react";
import { ReasoningBlocks } from "./reasoningBlocks";
import { PythonProvider, usePython, usePythonConsole } from "react-py";
import { blockToString, extractBlocks, processCodeBlocks } from "@/utils";



export default function Home() {
  const {
    completion,
    input,
    isLoading,
    handleInputChange,
    complete,
  } = useCompletion({
    api: '/api/completion',
  });

  const { runPython, stdout, stderr, isReady, writeFile } = usePython({
    packages: {
      official: ['pandas'],
    }
  });

  const [file, setFile] = useState<File | null>(null);
  const [blocks, setBlocks] = useState<Array<{ [key: string]: string }>>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const blocksEndRef = useRef<null | HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    blocksEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRunning(true);
    setBlocks([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target!.result as string;
      
      writeFile(file!.name, content);
    };
    reader.readAsText(file!);
    
    setBlocks(blocks => [...blocks, {
        tag: 'instruction',
        content: input,
        id: crypto.randomUUID(),
      },
      {
        tag: 'file',
        content: file!.name,
        id: crypto.randomUUID(),
      }
    ])
  }

  // Handles stdout, when execution is finished, updates blocks
  useEffect(() => {
    if (stdout.endsWith('ERROR\nEND OF EXECUTION\n')) {
      setBlocks(blocks => {
        const updatedBlocks = blocks.map((block, index) => {
          // If it's the last block, update its 'error' key
          if (index === blocks.length - 1) {
            return { ...block, error: '1' };
          }
          return block;
        });
      
        // Add the new block as before
        return [...updatedBlocks, {
          tag: 'output',
          content: stdout.slice(0, -'ERROR\nEND OF EXECUTION\n'.length).trim(),
          id: crypto.randomUUID(),
        }];
      });
    } else if (stdout.endsWith('END OF EXECUTION\n')) {
      setBlocks(blocks => [...blocks, {
        tag: 'output',
        content: stdout.slice(0, -'END OF EXECUTION\n'.length).trim(),
        id: crypto.randomUUID(),
      }])
    }
  }, [stdout])


  // When completion is finished updates blocks
  useEffect(() => {
    if (!isLoading) {
      // console.log(completion);
      setBlocks(blocks => [...blocks, ...extractBlocks(completion)]);
    }
  }, [isLoading]);
  
  // Handles blocks changes, dispatches code execution or completion
  useEffect(() => {
    console.log(blocks);
    scrollToBottom();
    if (blocks.length > 0 && blocks.length < 12) {
      if (blocks[blocks.length - 1].tag === 'code') {
        const codeToRun = processCodeBlocks(blocks);
        console.log(codeToRun);
        console.log('Running python...');
        runPython(codeToRun);
      } else if (blocks[blocks.length - 1].tag === 'file' || blocks[blocks.length - 1].tag === 'output'){
        const prompt = blocks.map(block => blockToString(block)).join('\n');;
        console.log('Running completion...');
        console.log(prompt);
        complete(prompt);
      } else {
        setIsRunning(false);
      }
    }

  }, [blocks]);

  console.log(stderr);
  console.log(stdout);
  return (
    <PythonProvider>
      <div className="max-w-3xl mx-auto">
        <form className="my-2" onSubmit={handleSubmit}>
          <Label htmlFor="csv-file">Upload your CSV here</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            required={true}
            onChange={handleFileChange}
          />
          <Label htmlFor="instruction">Enter your instruction</Label>
          <Textarea
            id="instruction"
            className="mt-2"
            placeholder="What is the highest...?"
            value={input}
            onChange={handleInputChange}
            required={true}
          />
          <Button className="w-full mt-2" type="submit" disabled={isRunning || !isReady}>
            Go!
          </Button>
        </form>
        <ReasoningBlocks blocks={blocks} />
        <div ref={blocksEndRef} />
        {isLoading && <ReasoningBlocks blocks={extractBlocks(completion)} />}
      </div>
      {/* <pre>{blocks.map(block => blockToString(block)).join('\n')}</pre> */}
    </PythonProvider>
  )
}
