import { useState, useCallback, useMemo, useEffect } from "react";
import { useEntityGetAll, useEntityUpdate } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffDocumentsEntity,
  StaffProfilesEntity,
  ContractTemplatesEntity,
  SignatureRequestsEntity,
} from "@/product-types";
import type { IStaffProfilesEntity } from "@/product-types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { OnboardingStepProfile } from "@/components/OnboardingStepProfile";
import { OnboardingStepDocuments } from "@/components/OnboardingStepDocuments";
import { OnboardingStepTerms } from "@/components/OnboardingStepTerms";
import { OnboardingStepSigning } from "@/components/OnboardingStepSigning";
import { OnboardingStepComplete } from "@/components/OnboardingStepComplete";
import { getFirstIncompleteStep } from "@/utils/onboardingUtils";

interface OnboardingWizardProps {
  staffProfile: IStaffProfilesEntity & { id: string };
}

export const OnboardingWizard = ({ staffProfile }: OnboardingWizardProps) => {
  // Fetch documents for this staff member
  const { data: documents, isLoading: loadingDocs } = useEntityGetAll(
    StaffDocumentsEntity,
    { staffProfileId: staffProfile.id },
    { enabled: !!staffProfile.id }
  );

  // Re-fetch profile to get latest data
  const { data: latestProfiles, isLoading: loadingLatest } = useEntityGetAll(
    StaffProfilesEntity,
    { email: staffProfile.email },
    { enabled: !!staffProfile.email }
  );
  const latestProfile = latestProfiles?.[0] || staffProfile;

  // Fetch contract templates and signature requests
  const { data: allTemplates } = useEntityGetAll(ContractTemplatesEntity);
  const { data: signatureRequests } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId: staffProfile.id },
    { enabled: !!staffProfile.id }
  );

  const activeTemplateIds = useMemo(
    () =>
      ((allTemplates as any[]) || [])
        .filter((t: any) => t.isActive)
        .map((t: any) => t.id as string),
    [allTemplates]
  );

  const sigReqInfos = useMemo(
    () =>
      ((signatureRequests as any[]) || []).map((r: any) => ({
        contractTemplateId: r.contractTemplateId as string | undefined,
        status: r.status as string | undefined,
      })),
    [signatureRequests]
  );

  // Update hook for completing onboarding
  const { updateFunction, isLoading: isUpdating } = useEntityUpdate(StaffProfilesEntity);

  // Calculate starting step from data
  const calculatedStartStep = useMemo(
    () => getFirstIncompleteStep(latestProfile, documents, sigReqInfos, activeTemplateIds),
    [latestProfile, documents, sigReqInfos, activeTemplateIds]
  );

  const [currentStep, setCurrentStep] = useState<number | null>(null);

  // Set initial step once data loads
  useEffect(() => {
    if (!loadingDocs && !loadingLatest && currentStep === null) {
      setCurrentStep(calculatedStartStep);
    }
  }, [loadingDocs, loadingLatest, calculatedStartStep, currentStep]);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min((prev ?? 0) + 1, 4));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max((prev ?? 0) - 1, 0));
  }, []);

  const handleCompleteOnboarding = useCallback(async () => {
    try {
      await updateFunction({
        id: staffProfile.id,
        data: { onboardingStatus: "pending_review" },
      });
      toast.success("Onboarding submitted successfully!");
      setCurrentStep(4); // Go to Complete step
    } catch {
      toast.error("Failed to submit onboarding. Please try again.");
    }
  }, [updateFunction, staffProfile.id]);

  const profileWithId = latestProfile as IStaffProfilesEntity & { id: string };
  const staffFullName = `${profileWithId?.firstName || ""} ${profileWithId?.lastName || ""}`.trim();

  // Loading state
  if (loadingDocs || loadingLatest || currentStep === null) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Stepper */}
      <OnboardingStepper currentStep={currentStep} />

      {/* Step content */}
      {currentStep === 0 && (
        <OnboardingStepProfile
          profile={latestProfile}
          onNext={handleNext}
        />
      )}
      {currentStep === 1 && (
        <OnboardingStepDocuments
          roleType={latestProfile?.roleType}
          documents={documents}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 2 && (
        <OnboardingStepSigning
          staffProfileId={staffProfile.id}
          staffEmail={profileWithId?.email || staffProfile.email || ""}
          staffName={staffFullName}
          staffPhone={(latestProfile as any)?.phone}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && (
        <OnboardingStepTerms
          onComplete={handleCompleteOnboarding}
          onBack={handleBack}
          isSubmitting={isUpdating}
        />
      )}
      {currentStep === 4 && <OnboardingStepComplete />}
    </div>
  );
};