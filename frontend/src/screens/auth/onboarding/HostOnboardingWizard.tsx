import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials, resetOnboarding } from "@/redux/slices/authSlice";
import { useRegisterHostMutation } from "@/redux/services/authApi";
import { showToast } from "@/components/common/Toast";
import type { User } from "@/types/api";
import type {
  BusinessFormData,
  HostDetailsFormData,
  WorkspaceFormData,
} from "./schema/onboarding.schema";
import StepBusiness from "./steps/StepBusiness";
import StepWorkspace from "./steps/StepWorkspace";
import StepListingsPath from "./steps/StepListingsPath";
import StepTeam, { type PendingInvite } from "./steps/StepTeam";
import StepFinish from "./steps/StepFinish";

type Phase = "business" | "workspace" | "listings" | "team" | "finish";

interface Props {
  email: string;
  hostDetails: HostDetailsFormData;
  onBackToDetails: () => void;
}

export default function HostOnboardingWizard({
  email,
  hostDetails,
  onBackToDetails,
}: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerHost, { isLoading: hostReg }] = useRegisterHostMutation();

  const [phase, setPhase] = useState<Phase>("business");
  const [business, setBusiness] = useState<BusinessFormData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceFormData | null>(null);
  const [listingsPath, setListingsPath] = useState("later");
  const [invites, setInvites] = useState<PendingInvite[]>([]);

  const createTenant = async (ws: WorkspaceFormData, biz: BusinessFormData) => {
    const result = await registerHost({
      email,
      firstName: hostDetails.firstName,
      lastName: hostDetails.lastName,
      phone: ws.phone || hostDetails.phone,
      tenantName: biz.tenantName,
      tenantSlug: biz.tenantSlug,
    }).unwrap();

    dispatch(
      setCredentials({
        user: result.data.user as unknown as User,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        tenantSlug: biz.tenantSlug,
      }),
    );

    // Optional: persist workspace defaults (currency/timezone) via tenant settings API when available
    try {
      sessionStorage.setItem(
        "onboarding:workspace",
        JSON.stringify({
          ...ws,
          businessTypes: biz.businessTypes,
          city: biz.city,
        }),
      );
    } catch {
      /* ignore */
    }

    showToast("Workspace created.", "success");
  };

  if (phase === "business") {
    return (
      <StepBusiness
        defaultValues={business ?? undefined}
        onBack={onBackToDetails}
        onContinue={(data) => {
          setBusiness(data);
          setPhase("workspace");
        }}
      />
    );
  }

  if (phase === "workspace" && business) {
    return (
      <StepWorkspace
        business={business}
        defaultValues={workspace ?? undefined}
        isLoading={hostReg}
        onBack={() => setPhase("business")}
        onContinue={async (ws) => {
          try {
            setWorkspace(ws);
            await createTenant(ws, business);
            setPhase("listings");
          } catch {
            /* rtk error middleware */
          }
        }}
      />
    );
  }

  if (phase === "listings") {
    return (
      <StepListingsPath
        onBack={() => setPhase("workspace")}
        onSkip={() => {
          setListingsPath("later");
          setPhase("team");
        }}
        onContinue={(path) => {
          setListingsPath(path);
          setPhase("team");
        }}
        onStartCsv={() => {
          setListingsPath("csv");
          // Authenticated: go to dashboard import, or open import modal route
          showToast(
            "Open Properties → Import to upload your CSV. You can also do this later.",
            "success",
          );
          setPhase("team");
          // navigate("/dashboard/properties?import=1"); // if you have this route
        }}
      />
    );
  }

  if (phase === "team") {
    return (
      <StepTeam
        invites={invites}
        onChange={setInvites}
        onBack={() => setPhase("listings")}
        onSkip={() => setPhase("finish")}
        onContinue={async () => {
          // Fire invites via invitationApi when endpoints allow post-register
          // for (const inv of invites) { await createInvitation(...) }
          setPhase("finish");
        }}
      />
    );
  }

  // finish
  if (!business || !workspace) return null;

  return (
    <StepFinish
      business={business}
      workspace={workspace}
      invites={invites}
      listingsPath={listingsPath}
      onDashboard={() => {
        dispatch(resetOnboarding());
        navigate("/dashboard");
      }}
    />
  );
}
