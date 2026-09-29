"use client";

import FormTab from "../formTab";
import { Application, FormDetails, FormStep, Obj } from "@/lib/types/questions";
import { createContext, useEffect, useRef, useState } from "react";
import { FormTabBottomBar } from "./formBottomBar";
import BeforeSubmitTab from "./beforeSubmitTab";
import {
  questionToFormItem,
  validateTab,
  saveApplication,
} from "@/lib/utils/forms/helpers";
import { Form } from "@/lib/types/application";
import { getFormLinks } from "@/lib/utils/forms/emailVariables";
import { toast } from "sonner";
import { ZodIssue } from "zod";

type FormContext = {
  formData: FormDetails;
  updateForm: (
    id: string,
    value: string | string[] | null | number | number[],
  ) => void;
};

const formContext = createContext<FormContext>({} as FormContext);

export default function ApplicationForm({
  userOverride,
  application,
  applicationForm,
}: {
  userOverride?: string;
  application: Application;
  applicationForm: Form;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const formQ = applicationForm.questions;
  const [formAnswers, setFormAnswers] = useState<FormDetails>(
    formStepsToFormDetails(formQ, application.details),
  );
  const formAnswersRef = useRef(formAnswers);

  function formStepsToFormDetails(
    steps: readonly FormStep[],
    initialValues: Obj,
  ): FormDetails {
    const details: FormDetails = {};
    steps.forEach((step) => {
      step.questions.forEach((question) => {
        details[question.id] = questionToFormItem(
          question,
          initialValues && initialValues[question.id]
            ? (initialValues[question.id] as string)
            : undefined,
          updateForm,
        );
      });
    });
    return details;
  }

  function updateForm(
    id: string,
    value: string | string[] | null | number | number[],
  ) {
    setFormAnswers((prev) => {
      const errors: ZodIssue[] = [];
      const result = prev[id].validation.safeParse(value);
      if (!result.success) {
        errors.push(...result.error.errors);
      }
      return {
        ...prev,
        [id]: {
          ...prev[id],
          value: value,
          errors: errors,
        },
      };
    });
  }

  function getFormTabToRender(step: number) {
    const tab = step;
    if (tab >= formQ.length) {
      return (
        <BeforeSubmitTab
          goToPreviousTab={goToPreviousTab}
          formId={applicationForm.id}
          otherUser={userOverride}
          formData={formAnswers}
          formQuestions={applicationForm.questions}
        />
      );
    }
    return (
      <FormTab
        key={tab}
        currentStep={tab}
        step={formQ[tab]}
        totalSteps={formQ.length}
        formData={formAnswers}
        links={getFormLinks(applicationForm.config)}
      />
    );
  }

  function goToNextTab() {
    try {
      const { isValid, formAnswers: newFormAnswers } = validateTab(
        formQ[currentStep],
        formAnswers,
      );
      setFormAnswers(Object.assign({}, newFormAnswers));
      if (!isValid) {
        toast.error("Please fix the errors before proceeding");
        return;
      }
      if (currentStep > formQ.length + 1) {
        return;
      }
      const formIdAsBigInt = BigInt(applicationForm.id);
      saveApplication(formAnswers, formIdAsBigInt, userOverride).then(() => {
        setCurrentStep((prev) => prev + 1);
        toast.success("All changes saved.");
      });
    } catch (e) {
      toast.error(
        "An error occurred; refresh and try again. If the problem persists, email us.",
        {
          action: {
            label: "Email Us",
            onClick: () => {
              window.open("mailto:strategy@ubclaunchpad.com");
            },
          },
        },
      );
    }
  }

  function goToPreviousTab() {
    if (currentStep === 0) {
      return;
    }
    setCurrentStep((prev) => prev - 1);
  }

  useEffect(() => {
    formAnswersRef.current = formAnswers;
  }, [formAnswers]);

  return (
    <formContext.Provider value={{ formData: formAnswers, updateForm }}>
      <main className="flex flex-col items-center justify-start overflow-scroll  flex-1 gap-0 w-full">
        <form className="flex flex-col flex-1 max-w-4xl  rounded border-neutral-800 items-center justify-center flex-shrink-0  w-full h-full gap-4 relative lg:p-2">
          {getFormTabToRender(currentStep)}
          <FormTabBottomBar
            numberOfTabs={formQ.length}
            currentTab={currentStep}
            goToNextTab={goToNextTab}
            goToPreviousTab={goToPreviousTab}
          />
        </form>
      </main>
    </formContext.Provider>
  );
}
