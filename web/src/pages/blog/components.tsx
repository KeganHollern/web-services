import { Lightbox } from "@/components/lightbox";
import { Editor } from "@/components/monaco-editor/editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Check, Copy, Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LanguageShortToFull } from "./constants";

function CopyButton({ content, className }: { content: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "rounded-md p-1.5 bg-background/80 border border-muted transition-opacity hover:bg-background cursor-pointer",
        className
      )}
      aria-label="Copy code"
    >
      {copied
        ? <Check className="size-4 text-green-500" />
        : <Copy className="size-4 text-muted-foreground" />}
    </button>
  );
}

function getAlignmentClass(className?: string): string {
  if (!className) return "mx-auto";
  if (className.includes("alignleft")) return "mr-auto";
  if (className.includes("alignright")) return "ml-auto";
  return "mx-auto"; // aligncenter, alignnone, or default
}

function BlogImage(props: React.ImgHTMLAttributes<HTMLImageElement> & { caption?: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { caption, className, width, height, title, ...imgProps } = props;
  const displayCaption = caption || title;
  const alignment = getAlignmentClass(className);

  return (
    <>
      <figure className={cn("my-6 flex flex-col items-center", alignment === "mr-auto" && "items-start", alignment === "ml-auto" && "items-end")}>
        <img
          {...imgProps}
          className={cn(
            "max-w-full h-auto rounded-lg border border-muted shadow-sm cursor-zoom-in transition-shadow hover:shadow-md",
            alignment
          )}
          style={width ? { maxWidth: `min(${width}px, 100%)` } : undefined}
          onClick={() => setLightboxOpen(true)}
        />
        {displayCaption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
            {displayCaption}
          </figcaption>
        )}
      </figure>
      <Lightbox open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div className="flex items-center justify-center p-4">
          <img
            src={imgProps.src}
            alt={imgProps.alt}
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      </Lightbox>
    </>
  );
}

const headers = {
  h1: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("scroll-m-20 text-center text-4xl mb-12 pb-5 border-b-1 font-bold tracking-tight text-balance", props.className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("mt-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", props.className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("mt-4 scroll-m-20 text-2xl font-semibold tracking-tight", props.className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn("mt-4 scroll-m-20 text-xl font-semibold tracking-tight", props.className)} {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn("mt-4 scroll-m-20 text-l font-semibold tracking-tight", props.className)} {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className={cn("mt-4 scroll-m-20 text-m font-semibold tracking-tight", props.className)} {...props}>
      {children}
    </h6>
  )
}

const lists = {
  ul: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", props.className)} {...props}>
      {children}
    </ul>
  ),
  // TODO: improve ordered lists...
  ol: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", props.className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn(props.className)} {...props}>
      {children}
    </li>
  ),
}

function ParagraphWithCaptions({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLParagraphElement>) {
  const childArray = React.Children.toArray(children);

  // Detect [caption ...] ... [/caption] pattern around images
  const hasCaptionTag = childArray.some(
    (child) => typeof child === "string" && (child.includes("[caption") || child.includes("[/caption]"))
  );

  if (hasCaptionTag) {
    // Process children: strip [caption ...] and [/caption], extract caption text and pass to BlogImage
    const processed: ReactNode[] = [];
    let pendingCaption: string | null = null;

    for (const child of childArray) {
      if (typeof child === "string") {
        // Strip [caption ...] opening tag
        let text = child.replace(/\[caption[^\]]*\]/g, "");
        // Extract caption text before [/caption]
        const closingMatch = text.match(/^(.*?)\[\/caption\]/);
        if (closingMatch) {
          pendingCaption = closingMatch[1].trim() || null;
          text = text.replace(/.*?\[\/caption\]/, "");
        }
        const trimmed = text.trim();
        if (trimmed) {
          processed.push(trimmed);
        }
      } else if (React.isValidElement(child) && (child.type === "img" || (child.type as { name?: string })?.name === "img" || child.type === BlogImage)) {
        // Apply pending caption to this image
        const imgChild = child as React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement> & { caption?: string }>;
        // Look ahead for caption text after this image
        const idx = childArray.indexOf(child);
        const next = childArray[idx + 1];
        let caption = pendingCaption;
        if (!caption && typeof next === "string") {
          const match = next.match(/^([^[]+)\[\/caption\]/);
          if (match) {
            caption = match[1].trim();
          }
        }
        processed.push(
          <BlogImage key={imgChild.key} {...imgChild.props} caption={caption || undefined} />
        );
        pendingCaption = null;
      } else {
        processed.push(child);
      }
    }
    return <div {...props}>{processed}</div>;
  }

  return (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-3", props.className)} {...props}>
      {children}
    </p>
  );
}

const text = {
  p: ParagraphWithCaptions,
  strong: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <strong className={cn("font-bold", props.className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <em className={cn("italic", props.className)} {...props}>
      {children}
    </em>
  ),
}

const flavor = {
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("my-6 border-muted", props.className)} {...props} />
  ),
  // TODO: give background color of bg2 from globals.css using tailwind...
  blockquote: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={cn("my-8 border-l-2 pl-6 italic", props.className)} {...props}>
      {children}
    </blockquote>
  ),
  a: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn("text-primary underline hover:text-primary/80", props.className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <BlogImage {...props} />
  ),
  video: ({ ...props }: React.VideoHTMLAttributes<HTMLVideoElement>) => (
    <video
      controls
      className={cn("my-6 w-full rounded-lg border-2 border-muted shadow-sm", props.className)}
      {...props}
    />
  ),
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  let content = '';
  let language = 'text';

  const childrenArray = React.Children.toArray(children);

  const codeChild = childrenArray.find(
    (child) => {
      if (!React.isValidElement(child)) return false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      if ((child.type as Function).name !== 'code') return false;
      return true;
    }
  ) as React.ReactElement<HTMLElement> | undefined;

  if (codeChild) {
    const codeContent = codeChild.props.children;
    if (typeof codeContent === 'string') {
      content = codeContent;
    } else if (Array.isArray(codeContent)) {
      content = codeContent.filter((node) => typeof node === 'string').join('');
    }

    const className = codeChild.props.className || '';
    const match = className.match(/language-(\w+)/);
    if (match) {
      language = match[1];
    }
  } else {
    content = childrenArray.filter((node) => typeof node === 'string').join('');
  }

  if (!content) {
    content = '';
  }

  language = LanguageShortToFull[language] ?? language;

  return (
    <div className="group relative my-4">
      <Editor
        readonly={true}
        content={content}
        className={cn("h-80 w-full relative border-2 border-muted rounded-lg p-1")}
        language={language}
        wordwrap={false}
        fontSize={12}
        minimap={false}
      />
      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton content={content} />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-md p-1.5 bg-background/80 border border-muted hover:bg-background cursor-pointer"
          aria-label="Expand code block"
        >
          <Maximize2 className="size-4 text-muted-foreground" />
        </button>
      </div>
      <Lightbox open={expanded} onOpenChange={setExpanded}>
        <div className="relative">
          <Editor
            readonly={true}
            content={content}
            className="h-[80vh] w-full relative rounded-lg p-1"
            language={language}
            wordwrap={false}
            fontSize={14}
            minimap={false}
          />
          <CopyButton content={content} className="absolute top-3 right-11 z-10" />
        </div>
      </Lightbox>
    </div>
  );
}

const code = {
  // inline code
  code: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        props.className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  // block code
  pre: ({ children }: { children: ReactNode } & React.HTMLAttributes<HTMLPreElement>) => {
    return <CodeBlock>{children}</CodeBlock>;
  },
}

const github = {
  del: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <span className={cn("line-through", props.className)} {...props}>
      {children}
    </span>
  ),
  input: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <Checkbox className={cn("align-middle disabled:cursor-auto", props.className)} {...props}>{children}</Checkbox>
  ),
  section: () => (<></>), // disabled section for footnote
  sup: () => (<></>), // disabled sup for footnote

  table: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableElement>) => (
    <Table className={cn("w-full", props.className)} {...props}>
      {children}
    </Table>
  ),
  tbody: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableBody className={cn(props.className)} {...props}>
      {children}
    </TableBody>
  ),
  thead: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableHeader className={cn(props.className)} {...props}>
      {children}
    </TableHeader>
  ),
  th: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableCellElement>) => (
    <TableHead className={cn("border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right", props.className)} {...props}>
      {children}
    </TableHead>
  ),
  td: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableCellElement>) => (
    <TableCell className={cn("border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right", props.className)} {...props}>
      {children}
    </TableCell>
  ),
  tr: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) => (
    <TableRow className={cn("even:bg-muted m-0 border-t p-0", props.className)} {...props}>
      {children}
    </TableRow>
  ),
}

// stolen from shadcn/typeography
export const mdxComponents = {
  ...headers,
  ...lists,
  ...text,
  ...flavor,
  ...code,
  ...github,
};