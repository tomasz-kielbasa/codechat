import React from 'react';

import { CodeBlock, vs2015 } from 'react-code-blocks';
import Markdown from 'react-markdown';

interface ReasoningBlocksProps {
    blocks: Array<{ [key: string]: string }>;
}


export const ReasoningBlocks: React.FC<ReasoningBlocksProps> = ({ blocks }) => {
        
    return (
        <div className='mt-2'>
            {blocks.map(({tag, content, id}) => {
                if (tag === 'code') {
                    return <CodeBlock
                        key={id}
                        language='python'
                        text={content}
                        theme={vs2015}
                        customStyle={{
                            backgroundColor: 'hsl(var(--secondary))',
                            marginTop: '8px'
                        }}
                    />
                }
                if (tag === 'text') {
                    return (<div className='bg-secondary p-2 rounded' key={id}>
                        <Markdown key={id}>{content}</Markdown>
                    </div>)
                }
                if (tag === 'output') {
                    return <pre className='p-2 whitespace-pre-wrap' key={id}>{content}</pre>
                }
                if (tag === 'img') {
                    return <img className='mt-2' src={content} key={id} />
                }

                return <></>
            })}
        </div>
    );
};