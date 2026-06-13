"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  children: string;
}

export function MarkdownContent({ children }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h3 className="text-foreground mt-3 mb-1.5 text-sm font-semibold first:mt-0">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h4 className="text-foreground mt-2.5 mb-1 text-sm font-semibold first:mt-0">
            {children}
          </h4>
        ),
        h3: ({ children }) => (
          <h5 className="text-foreground mt-2 mb-1 text-[13px] font-medium first:mt-0">
            {children}
          </h5>
        ),

        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-primary/30 text-foreground/70 my-2 border-l-2 pl-3 italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-3" />,

        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {children}
          </a>
        ),

        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-lg bg-black/5 p-2.5 font-mono text-xs leading-relaxed">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-xs">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,

        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-border/50 border-b px-2 py-1 text-left font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-border/30 border-b px-2 py-1">{children}</td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
