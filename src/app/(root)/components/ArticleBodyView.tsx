import { Fragment } from "react";
import { parseInlineMarkdown, type ArticleBodyBlock } from "@/lib/article-body";

function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((piece, index) => {
        const content = piece.bold ? <strong>{piece.text}</strong> : <Fragment>{piece.text}</Fragment>;
        if (!piece.href) return <Fragment key={index}>{content}</Fragment>;
        return (
          <a
            key={index}
            href={piece.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {content}
          </a>
        );
      })}
    </>
  );
}

export function ArticleBodyView({ blocks }: { blocks: ArticleBodyBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-[var(--gray-500)]">Текст пока пуст</p>;
  }

  return (
    <div className="space-y-5 text-[17px] leading-8 text-[var(--gray-800)]">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          if (block.level === 3) {
            return (
              <h3 key={index} className="text-xl font-semibold leading-snug text-[var(--gray-900)]">
                <InlineText text={block.text} />
              </h3>
            );
          }
          return (
            <h2 key={index} className="text-2xl font-bold leading-snug text-[var(--gray-900)]">
              <InlineText text={block.text} />
            </h2>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-[var(--accent-400)] pl-4 text-[var(--gray-700)]"
            >
              <InlineText text={block.text} />
            </blockquote>
          );
        }

        if (block.kind === "ul" || block.kind === "ol") {
          const ListTag = block.kind === "ul" ? "ul" : "ol";
          return (
            <ListTag
              key={index}
              className={
                block.kind === "ul" ? "list-disc space-y-2 pl-6" : "list-decimal space-y-2 pl-6"
              }
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineText text={item} />
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.kind === "paragraph") {
          return (
            <p key={index} className="whitespace-pre-wrap">
              <InlineText text={block.text} />
            </p>
          );
        }

        return (
          <div
            key={index}
            className="overflow-x-auto rounded-xl border border-[var(--gray-200)] bg-white"
          >
            <table className="w-full min-w-[20rem] border-collapse text-left text-base leading-6">
              <thead className="bg-[var(--gray-100)] text-[var(--gray-900)]">
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th
                      key={cellIndex}
                      className="border-b border-[var(--gray-200)] px-4 py-3 font-semibold"
                    >
                      <InlineText text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-t border-[var(--gray-200)] odd:bg-white even:bg-[var(--gray-50)]"
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 align-top">
                        <InlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
