import { CopyBlock, vs2015 } from "react-code-blocks";
import Markdown from "react-markdown";

type ReasoningBlocksProps = {
  blocks: Array<{ [key: string]: string }>;
}

export const BlockDisplay = ({ blocks }: ReasoningBlocksProps) => {
  return (
    <div className="flex flex-col gap-2 my-2">
      {blocks.map(({content, tag, id}) => {
        if (tag === 'code') {
          return <CopyBlock
            text={content}
            key={id}
            theme={vs2015}
            language="python"
            codeBlock={true}
          />
        }
        if (tag === 'output') {
          // return <CopyBlock
          //   text={content}
          //   key={id}
          //   theme={vs2015}
          //   language="text"
          //   showLineNumbers={false}
          //   codeBlock={true}
          // />
          return (<pre key={id}>
            {content}
          </pre>)
        }
        if (tag === 'text') {
          return <Markdown key={id}>{content}</Markdown>
        }
        if (tag === 'img') {
          return <img
            key={id}
            src={content}
            className="w-full"
          />
        }
        if (tag === 'instruction') {
          return <p key={id} className="p-2 rounded bg-accent-foreground w-fit self-end">{content}</p>
        }
      })}
    </div>
  )
}