import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TextBlock {
  type: "text";
  content: string;
}

interface ImageBlock {
  type: "image";
  url: string;
  alt?: string;
}

interface TwoColumnBlock {
  type: "two-column";
  text: string;
  image: { url: string; alt?: string };
  imagePosition: "left" | "right";
}

type Block = TextBlock | ImageBlock | TwoColumnBlock;

interface BlogBlockRendererProps {
  blocks: Block[];
}

export default function BlogBlockRenderer({ blocks }: BlogBlockRendererProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return (
              <div key={index} className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.content}
                </ReactMarkdown>
              </div>
            );

          case "image":
            return (
              <figure key={index} className="w-full">
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="w-full rounded-xl object-cover"
                  loading="lazy"
                />
                {block.alt && (
                  <figcaption className="text-center text-sm text-base-content/50 mt-2">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );

          case "two-column": {
            const textContent = (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.text}
                </ReactMarkdown>
              </div>
            );

            const imageContent = (
              <figure className="w-full h-full">
                <img
                  src={block.image.url}
                  alt={block.image.alt || ""}
                  className="w-full h-full rounded-xl object-cover"
                  loading="lazy"
                />
              </figure>
            );

            return (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                {block.imagePosition === "left" ? (
                  <>
                    {imageContent}
                    {textContent}
                  </>
                ) : (
                  <>
                    {textContent}
                    {imageContent}
                  </>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
