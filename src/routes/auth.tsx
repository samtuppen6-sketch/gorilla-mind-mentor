import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  getProfile,
  setProfile,
  type AuthProvider,
  type IdentityProfile,
} from "@/lib/profile-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Gorilla Mind" },
      { name: "description", content: "Create your account to start your reset." },
    ],
  }),
  component: () => (
    <AppShell>
      <AuthPage />
    </AppShell>
  ),
});

function makeId() {
  return `gm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildIdentity(partial: Partial<IdentityProfile> & { authProvider: AuthProvider }): IdentityProfile {
  const now = new Date().toISOString();
  const firstName = partial.firstName ?? "";
  const lastName = partial.lastName ?? "";
  return {
    userId: partial.userId ?? makeId(),
    firstName,
    lastName,
    fullName: partial.fullName ?? `${firstName} ${lastName}`.trim(),
    email: partial.email ?? "",
    phoneNumber: partial.phoneNumber ?? "",
    authProvider: partial.authProvider,
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);

  const placeholderAuth = (provider: "google" | "apple") => {
    // TODO: integrate real Google/Apple OAuth when configured
    toast.message(`${provider === "google" ? "Google" : "Apple"} sign-in coming soon`, {
      description: "Use Continue with Email to start now.",
    });
  };

  const completeEmail = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("First name, last name and email are required.");
      return;
    }
    if (!consent) {
      toast.error("Please confirm the consent box to continue.");
      return;
    }
    const identity = buildIdentity({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      authProvider: "email",
    });
    const current = getProfile();
    setProfile({
      ...current,
      name: identity.firstName || current.name,
      identityProfile: identity,
    });
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="px-5 pb-12 pt-6 space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">
          Step 1 — Account
        </p>
        <h1 className="text-2xl font-semibold mt-1">Create your account</h1>
        <p className="text-xs text-muted-foreground mt-2">
          So your standard, training and coaching are saved against you.
        </p>
      </div>

      {mode === "choose" && (
        <div className="space-y-3">
          <ProviderButton
            label="Continue with Google"
            onClick={() => placeholderAuth("google")}
          />
          <ProviderButton
            label="Continue with Apple"
            onClick={() => placeholderAuth("apple")}
          />
          <ProviderButton
            label="Continue with Email"
            primary
            onClick={() => setMode("email")}
          />
          <button
            onClick={() => {
              const identity = buildIdentity({
                userId: "demo_user_sam",
                firstName: "Sam",
                lastName: "Demo",
                fullName: "Sam Demo",
                email: "demo@gorillamind.local",
                authProvider: "local_placeholder",
              });
              identity.onboardingComplete = true;
              const current = getProfile();
              setProfile({
                ...current,
                name: "Sam",
                identityProfile: identity,
                onboardingComplete: true,
                onboardingCompletedAt: new Date().toISOString(),
              });
              toast.success("Demo Mode active");
              navigate({ to: "/coach" });
            }}
            className="w-full rounded-lg border border-dashed border-gold/60 px-4 py-3 text-sm text-gold hover:bg-gold/5"
          >
            Continue in Demo Mode
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            Demo Mode skips sign-in for testing. Sam Demo · demo@gorillamind.local
          </p>
          <ConsentText />
        </div>
      )}

      {mode === "email" && (
        <div className="space-y-3">
          <Field
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Sam"
          />
          <Field
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Operator"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
          />
          <Field
            label="Phone number — optional for future accountability reminders"
            value={phoneNumber}
            onChange={setPhoneNumber}
            type="tel"
            placeholder="+44 7..."
          />
          <Field
            label="Password (optional placeholder — auth TODO)"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
          />
          <label className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Your answers help Gorilla Mind personalise your coaching. This is not
              medical or emergency support. If you are in immediate danger, contact
              emergency services. I understand and agree to continue.
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setMode("choose")}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm"
            >
              Back
            </button>
            <button
              onClick={completeEmail}
              className="flex-1 rounded-lg bg-gold text-background font-semibold px-4 py-3 text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold ${
        primary
          ? "bg-gold text-background"
          : "border border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ConsentText() {
  return (
    <p className="pt-3 text-[11px] text-muted-foreground">
      Your answers help Gorilla Mind personalise your coaching. This is not medical
      or emergency support. If you are in immediate danger, contact emergency
      services.
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-gold-muted mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
