import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const headers = {
  h1: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("scroll-m-20 text-center text-4xl font-bold tracking-tight text-balance", props.className)} {...props}>
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

const text = {
  p: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-2", props.className)} {...props}>
      {children}
    </p>
  ),
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
  blockquote: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={cn("mt-2 border-l-2 pl-6 italic", props.className)} {...props}>
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
  img: ({ ...props }: {} & React.HTMLAttributes<HTMLImageElement>) => (
    <img className={cn(props.className)} {...props} />
  ),
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
  pre: ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLPreElement>) => {

    // console.log(children);
    // // TODO: find child of type <code> and get its inner content
    // // TODO: pass syntax into "editor" by extracting class from <code> 
    // // will be `language-<syntax>`
    // // TODO: maybe we should just make a new monaco editor that inlines properly...
    // return (
    //   <Editor readonly={true} content={children?.toString()} />
    // )

    return (
      <pre
        className={cn("bg-muted p-4 rounded-md overflow-auto mb-4 font-mono text-sm", props.className)}
        {...props}
      >
        {children}
      </pre>
    )
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




  // custom wrapper to wrap all markdown content
  wrapper: ({ children }: { children: ReactNode }) => (
    <div className="mx-auto max-w-3xl">
      <div className="p-6">{children}</div>
    </div>
  ),
};