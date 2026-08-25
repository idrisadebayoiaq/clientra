"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { SERVICES, TARGET_AUDIENCES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const steps = [
  "Services",
  "Expertise",
  "Audience",
  "Locations",
  "Project value",
  "Outreach",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState("");
  const [expertise, setExpertise] = useState("");
  const [audiences, setAudiences] = useState<string[]>([]);
  const [worldwide, setWorldwide] = useState(true);
  const [countries, setCountries] = useState("");
  const [regions, setRegions] = useState("");
  const [cities, setCities] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [outreachMode, setOutreachMode] = useState<"manual" | "ai_approval" | "automatic">("manual");
  const [autoFollowups, setAutoFollowups] = useState(false);
  const [aiAssistedReplies, setAiAssistedReplies] = useState(false);
  const [automaticReplies, setAutomaticReplies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in.");
      setSaving(false);
      return;
    }

    const serviceRows = [
      ...services.map((key) => ({ user_id: user.id, service_key: key })),
      ...(customService.trim()
        ? [{ user_id: user.id, service_key: "custom", custom_label: customService.trim() }]
        : []),
    ];

    await supabase.from("user_services").delete().eq("user_id", user.id);
    if (serviceRows.length) {
      const { error: serviceError } = await supabase.from("user_services").insert(serviceRows);
      if (serviceError) {
        setError(serviceError.message);
        setSaving(false);
        return;
      }
    }

    const { error: prefError } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      target_audiences: audiences,
      target_worldwide: worldwide,
      target_countries: splitList(countries),
      target_regions: splitList(regions),
      target_cities: splitList(cities),
      project_value_min: minValue ? Number(minValue) : null,
      project_value_max: maxValue ? Number(maxValue) : null,
      outreach_mode: outreachMode,
      auto_followups: autoFollowups,
      ai_assisted_replies: aiAssistedReplies,
      automatic_replies: automaticReplies,
    }, { onConflict: "user_id" });
    if (prefError) {
      setError(prefError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ expertise_description: expertise, onboarding_completed: true })
      .eq("id", user.id);
    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-ink-muted">
        Step {step + 1} of {steps.length}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{steps[step]}</h1>
      <Card className="mt-6 p-6">
        {step === 0 ? (
          <div>
            <h2 className="text-lg font-semibold">What services do you offer?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service.key}
                  type="button"
                  onClick={() => toggle(services, service.key, setServices)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    services.includes(service.key)
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-ink-muted",
                  )}
                >
                  {service.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="custom">Custom service</Label>
              <Input id="custom" value={customService} onChange={(e) => setCustomService(e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="text-lg font-semibold">Describe your expertise</h2>
            <Textarea className="mt-4" value={expertise} onChange={(e) => setExpertise(e.target.value)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="text-lg font-semibold">Who do you want to work with?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {TARGET_AUDIENCES.map((audience) => (
                <button
                  key={audience.key}
                  type="button"
                  onClick={() => toggle(audiences, audience.key, setAudiences)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    audiences.includes(audience.key)
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-ink-muted",
                  )}
                >
                  {audience.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Target locations</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={worldwide} onChange={(e) => setWorldwide(e.target.checked)} />
              Worldwide
            </label>
            <div>
              <Label>Countries</Label>
              <Input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="United States, United Kingdom" />
            </div>
            <div>
              <Label>Regions</Label>
              <Input value={regions} onChange={(e) => setRegions(e.target.value)} />
            </div>
            <div>
              <Label>Cities</Label>
              <Input value={cities} onChange={(e) => setCities(e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Minimum project value</Label>
              <Input type="number" min={0} value={minValue} onChange={(e) => setMinValue(e.target.value)} />
            </div>
            <div>
              <Label>Maximum project value</Label>
              <Input type="number" min={0} value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Outreach preferences</h2>
            <p className="text-sm text-ink-muted">Automatic actions stay off unless you turn them on.</p>
            {[
              ["manual", "Manual outreach"],
              ["ai_approval", "AI-generated messages requiring approval"],
              ["automatic", "Automatic outreach (off by default)"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="outreach"
                  checked={outreachMode === value}
                  onChange={() => setOutreachMode(value as typeof outreachMode)}
                />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoFollowups} onChange={(e) => setAutoFollowups(e.target.checked)} />
              Automated follow-ups
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={aiAssistedReplies} onChange={(e) => setAiAssistedReplies(e.target.checked)} />
              AI-assisted replies
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={automaticReplies} onChange={(e) => setAutomaticReplies(e.target.checked)} />
              Automatic replies
            </label>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={saving}>
              {saving ? "Saving…" : "Finish"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
