import { FormDetails, FormStep } from "@/lib/types/questions";
import { FormLinks } from "@/lib/utils/forms/emailVariables";
import FormItemInput from "./formItem";
import LaunchTrack from "./launch/launchTrack";
import LaunchRocket from "./launch/launchRocket";

export default function FormTab({
  formData,
  step,
  currentStep,
  totalSteps,
  links,
}: {
  currentStep: number;
  step: FormStep;
  totalSteps: number;
  formData: FormDetails;
  links?: FormLinks;
}) {
  const { title, questions } = step;
  return (
    <div className="glass-panel flex flex-col items-center flex-1 lg:max-w-4xl flex-shrink-0 p-4 lg:p-10 lg:pb-6 rounded-2xl gap-6 w-full animate-fade-up">
      <header className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <LaunchRocket
            firing={currentStep > 0}
            direction="right"
            size={18}
          />
          <span className="text-[11px] font-semibold tracking-[0.24em] uppercase text-lp-200/90">
            Phase {currentStep + 1}
            <span className="text-neutral-500"> / {totalSteps}</span>
          </span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-heading w-full text-left font-bold text-white">
          {title}
        </h2>
        <LaunchTrack current={currentStep} total={totalSteps} />
      </header>
      <div className="w-full flex-1 flex-col flex gap-3 relative">
        {questions.map((question) => (
          <FormItemInput
            question={question}
            key={question.id}
            questionData={formData[question.id]}
            expanded={false}
            launch
            links={links}
          />
        ))}
      </div>
    </div>
  );
}
