"use client";

import { FormItem, FormQuestion } from "@/lib/types/questions";
import formQuestionMapper from "./formMapper";
import { FormLinks, fillFormLinks } from "@/lib/utils/forms/emailVariables";
import React from "react";

// Renders markdown-style links ([text](url)) and bare URLs in a question
// label as real clickable anchors.
export function InfoText({ text }: { text: string }) {
  const pattern =
    /\[([^\]]+)\]\((\S+?)\)|((?:https?:\/\/)[^\s()<>]+[^\s.,;:!?()<>])/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const href = match[2] || match[3];
    const label = match[1] || match[3];
    parts.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lp-400 underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return (
    <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
      {parts}
    </p>
  );
}

export default function FormItemInput({
  expanded = false,
  questionData,
  question,
  launch = false,
  links,
}: {
  expanded?: boolean;
  questionData: FormItem;
  question: FormQuestion;
  launch?: boolean;
  // Fills {{projectCatalog}} etc.; omitted (e.g. in admin views) to keep tags.
  links?: FormLinks;
}) {
  const label = links ? fillFormLinks(question.label, links) : question.label;
  if (question.type === "info") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2 flex-col w-full">
          <div className="w-full rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
            <InfoText text={label} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        className={`flex  gap-2 ${question.label.length > 40 || expanded ? "flex-col" : "lg:flex-row flex-col"}`}
      >
        <label
          className={`flex   flex-shrink-0  pt-2 gap-0.5 ${
            question.label.length > 40 || expanded
              ? "w-full"
              : "w-60 min-w-60 "
          } ${launch ? "font-heading font-semibold text-[15px] text-neutral-200" : ""}`}
        >
          <span className="">{label}</span>
          {question.config.validation.isRequired && (
            <span className={launch ? "text-lp-400" : "text-lp-600"}>*</span>
          )}
        </label>
        <div className="flex flex-col items-center  w-full gap-2 relative *:w-full">
          {formQuestionMapper({
            question: question,
            value: questionData.value as string,
            OnChange: questionData.eventHandlers.onChange,
          })}
          <span className="text-red-500 px-1 max-h-6 text-sm">
            {questionData.errors && questionData.errors.length > 0
              ? questionData.errors.map((error) => error.message).join(", ")
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
