"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { ImageModal } from "./ImageModal";
import {
  parseBoldSegments,
  resolveBoldFontWeight,
  type CategoryInfoBlock,
} from "@/lib/category-info";

export function CategoryInfoBlocks({ blocks }: { blocks: CategoryInfoBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "text") {
          if (!block.content) return null;
          return (
            <p
              key={block.id}
              className="whitespace-pre-wrap text-[var(--gray-700)] leading-relaxed"
            >
              {parseBoldSegments(block.content).map((segment, index) =>
                segment.bold ? (
                  <strong
                    key={index}
                    style={
                      block.boldScale != null
                        ? {
                            fontWeight: resolveBoldFontWeight(block.boldScale),
                          }
                        : undefined
                    }
                  >
                    {segment.text}
                  </strong>
                ) : (
                  <Fragment key={index}>{segment.text}</Fragment>
                ),
              )}
            </p>
          );
        }
        return <GuideImage key={block.id} url={block.url} alt={block.alt} />;
      })}
    </div>
  );
}

function GuideImage({ url, alt }: { url: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  const label = alt || "Изображение";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full overflow-hidden rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)]"
        aria-label={`Открыть изображение: ${label}`}
      >
        <Image
          src={url}
          alt={label}
          width={1200}
          height={800}
          className="h-auto w-full object-contain"
        />
      </button>
      <ImageModal
        isOpen={open}
        onClose={() => setOpen(false)}
        imageUrl={url}
        alt={label}
      />
    </>
  );
}
