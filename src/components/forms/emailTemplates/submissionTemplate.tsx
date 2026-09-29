import { EmailFooter } from "./emailFooter";

const DOCS =
  "https://launchpadubc.notion.site/65c5e68a3b1b4d84bcb972f29db80b06?v=a59aebaa79c8408488ccf492b0e1991d&pvs=4";

export function SubmissionTemplate({ formTitle }: { formTitle: string }) {
  return (
    <div>
      <p className={"text-center"}>
        Your submission to <strong>{formTitle}</strong> has been received. Thank
        you!
      </p>
      <p className={"text-center"}>
        If you have any questions, please contact us at{" "}
        <a href="mailto:strategy@ubclaunchpad.com">strategy@ubclaunchpad.com</a>
      </p>
      <div className="">
        <a href={DOCS}>Click to learn more about UBC Launch Pad</a>
      </div>
      <EmailFooter />
    </div>
  );
}
