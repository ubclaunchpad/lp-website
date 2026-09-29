import { Markdown, Html } from "@react-email/components";
import { EmailFooter } from "./emailFooter";

export function MarkdownTemplate({
  markdown,
  replacements,
}: {
  markdown: string;
  replacements?: Record<string, string>;
}) {
  const cleanedMarkdown = replaceTemplateValues(markdown, replacements || {});

  return (
    <Html lang="en" dir="ltr">
      <Markdown>{cleanedMarkdown}</Markdown>
      <EmailFooter />
    </Html>
  );
}

function replaceTemplateValues(text: string, values: any) {
  const regex = /{{(.*?)}}/g;
  const matches = text.match(regex);
  if (!matches) {
    return text;
  }
  let newText = text;
  matches.forEach((match) => {
    const key = match.replace("{{", "").replace("}}", "");
    if (!values[key]) {
      newText = newText.replace(match, "");
    } else {
      newText = newText.replace(match, values[key]);
    }
  });
  return newText;
}
