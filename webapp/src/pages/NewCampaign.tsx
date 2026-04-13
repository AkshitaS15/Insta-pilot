import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronRight, ChevronLeft, Check, Instagram, Zap } from "lucide-react";
import {
  InstagramAccount,
  Genre,
  GENRE_LABELS,
  GENRE_EMOJIS,
  PostType,
  ContentSource,
  Frequency,
  FREQUENCY_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Account", "Setup", "Post Settings", "Schedule", "Review"];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const POST_TIMES = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const label = hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`;
  const value = `${String(hour).padStart(2, "0")}:00`;
  return { label, value };
});

type WizardState = {
  instagramAccountId: string;
  name: string;
  genres: Genre[];
  postTypes: PostType[];
  contentSource: ContentSource[];
  frequency: Frequency | "";
  frequencyDays: number[];
  postTime: string;
};

const GENRES: Genre[] = [
  "humanic",
  "animated",
  "ai_generated",
  "satisfying",
  "nature",
  "motivational",
  "comedy",
  "fashion",
  "food",
  "travel",
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    instagramAccountId: "",
    name: "",
    genres: [],
    postTypes: [],
    contentSource: [],
    frequency: "",
    frequencyDays: [],
    postTime: "09:00",
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["instagram-accounts"],
    queryFn: () => api.get<InstagramAccount[]>("/api/instagram/accounts"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/campaigns", {
        instagramAccountId: state.instagramAccountId,
        name: state.name,
        genres: state.genres,
        postTypes: state.postTypes,
        contentSource: state.contentSource,
        frequency: state.frequency,
        frequencyDays: state.frequency === "CUSTOM" ? state.frequencyDays : undefined,
        postTime: state.postTime,
      }),
    onSuccess: () => {
      toast.success("Campaign launched!");
      navigate("/campaigns");
    },
    onError: () => {
      toast.error("Failed to create campaign");
    },
  });

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGenre = (g: Genre) => {
    setState((prev) => ({
      ...prev,
      genres: prev.genres.includes(g) ? prev.genres.filter((x) => x !== g) : [...prev.genres, g],
    }));
  };

  const togglePostType = (pt: PostType) => {
    setState((prev) => ({
      ...prev,
      postTypes: prev.postTypes.includes(pt)
        ? prev.postTypes.filter((x) => x !== pt)
        : [...prev.postTypes, pt],
    }));
  };

  const toggleContentSource = (cs: ContentSource) => {
    setState((prev) => ({
      ...prev,
      contentSource: prev.contentSource.includes(cs)
        ? prev.contentSource.filter((x) => x !== cs)
        : [...prev.contentSource, cs],
    }));
  };

  const toggleDay = (day: number) => {
    setState((prev) => ({
      ...prev,
      frequencyDays: prev.frequencyDays.includes(day)
        ? prev.frequencyDays.filter((d) => d !== day)
        : [...prev.frequencyDays, day],
    }));
  };

  const canProceed = () => {
    if (step === 0) return !!state.instagramAccountId;
    if (step === 1) return !!state.name && state.genres.length > 0;
    if (step === 2) return state.postTypes.length > 0 && state.contentSource.length > 0;
    if (step === 3)
      return !!state.frequency && (state.frequency !== "CUSTOM" || state.frequencyDays.length > 0);
    return true;
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            New Campaign
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up automated Instagram posting in a few steps
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all shrink-0",
                  i < step
                    ? "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white"
                    : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:block",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-1",
                    i < step ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {step === 0 && (
            <Step1Account
              accounts={accounts ?? []}
              loading={accountsLoading}
              selected={state.instagramAccountId}
              onSelect={(id) => update("instagramAccountId", id)}
            />
          )}
          {step === 1 && (
            <Step2Setup
              name={state.name}
              genres={state.genres}
              onNameChange={(v) => update("name", v)}
              onToggleGenre={toggleGenre}
            />
          )}
          {step === 2 && (
            <Step3PostSettings
              postTypes={state.postTypes}
              contentSource={state.contentSource}
              onTogglePostType={togglePostType}
              onToggleContentSource={toggleContentSource}
            />
          )}
          {step === 3 && (
            <Step4Schedule
              frequency={state.frequency}
              frequencyDays={state.frequencyDays}
              postTime={state.postTime}
              onFrequency={(v) => update("frequency", v)}
              onToggleDay={toggleDay}
              onPostTime={(v) => update("postTime", v)}
            />
          )}
          {step === 4 && <Step5Review state={state} accounts={accounts ?? []} />}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 hover:opacity-90"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Launch Campaign
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Step1Account({
  accounts,
  loading,
  selected,
  onSelect,
}: {
  accounts: InstagramAccount[];
  loading: boolean;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Select Instagram Account</h2>
      {loading ? (
        <div className="grid gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <Instagram className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">No accounts connected</p>
          <p className="text-sm text-muted-foreground mb-4">
            Connect an Instagram account first to create a campaign.
          </p>
          <Button asChild variant="outline">
            <a href="/connect">Connect Instagram</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                selected === acc.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={acc.profilePicUrl ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white font-bold">
                  {acc.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">@{acc.username}</p>
                {acc.pageName && (
                  <p className="text-xs text-muted-foreground">{acc.pageName}</p>
                )}
              </div>
              {selected === acc.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Step2Setup({
  name,
  genres,
  onNameChange,
  onToggleGenre,
}: {
  name: string;
  genres: Genre[];
  onNameChange: (v: string) => void;
  onToggleGenre: (g: Genre) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          placeholder="My Awesome Campaign"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-3">
        <Label>Content Genres (select all that apply)</Label>
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((genre) => {
            const selected = genres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => onToggleGenre(genre)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                  selected
                    ? "border-pink-500/50 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-400/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-lg">{GENRE_EMOJIS[genre]}</span>
                <span className="text-sm font-medium">{GENRE_LABELS[genre]}</span>
                {selected && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step3PostSettings({
  postTypes,
  contentSource,
  onTogglePostType,
  onToggleContentSource,
}: {
  postTypes: PostType[];
  contentSource: ContentSource[];
  onTogglePostType: (pt: PostType) => void;
  onToggleContentSource: (cs: ContentSource) => void;
}) {
  const postTypeOptions: { value: PostType; label: string; desc: string; icon: string }[] = [
    { value: "POST", label: "Post", desc: "Static image posts", icon: "🖼️" },
    { value: "REEL", label: "Reel", desc: "Short-form video content", icon: "🎬" },
  ];

  const sourceOptions: { value: ContentSource; label: string; desc: string; icon: string }[] = [
    {
      value: "AI",
      label: "AI Generated",
      desc: "DALL-E 3 images + GPT-4 captions",
      icon: "🤖",
    },
    {
      value: "UPLOAD",
      label: "Upload URL",
      desc: "Provide your own image/video URLs",
      icon: "📤",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Post Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {postTypeOptions.map((opt) => {
            const selected = postTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onTogglePostType(opt.value)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-2xl mb-2 block">{opt.icon}</span>
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <Label>Content Source</Label>
        <div className="grid gap-3">
          {sourceOptions.map((opt) => {
            const selected = contentSource.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onToggleContentSource(opt.value)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
                {selected && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step4Schedule({
  frequency,
  frequencyDays,
  postTime,
  onFrequency,
  onToggleDay,
  onPostTime,
}: {
  frequency: Frequency | "";
  frequencyDays: number[];
  postTime: string;
  onFrequency: (v: Frequency) => void;
  onToggleDay: (d: number) => void;
  onPostTime: (v: string) => void;
}) {
  const freqOptions: { value: Frequency; label: string; desc: string }[] = [
    { value: "DAILY", label: "Daily", desc: "Post every single day" },
    { value: "3X_WEEK", label: "3x per Week", desc: "Three posts per week" },
    { value: "WEEKLY", label: "Weekly", desc: "Once per week" },
    { value: "CUSTOM", label: "Custom Days", desc: "Choose specific days" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Posting Frequency</Label>
        <div className="grid grid-cols-2 gap-3">
          {freqOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFrequency(opt.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                frequency === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              )}
            >
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {frequency === "CUSTOM" && (
        <div className="space-y-3">
          <Label>Select Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((day, i) => (
              <button
                key={day}
                onClick={() => onToggleDay(i)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all",
                  frequencyDays.includes(i)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/30"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="post-time">Post Time</Label>
        <select
          id="post-time"
          value={postTime}
          onChange={(e) => onPostTime(e.target.value)}
          className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {POST_TIMES.map((t) => (
            <option key={t.value} value={t.value}>
              Post at {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Step5Review({
  state,
  accounts,
}: {
  state: WizardState;
  accounts: InstagramAccount[];
}) {
  const account = accounts.find((a) => a.id === state.instagramAccountId);

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-lg">Review & Launch</h2>
      <div className="space-y-3">
        {[
          {
            label: "Account",
            value: account ? `@${account.username}` : "—",
          },
          { label: "Campaign Name", value: state.name || "—" },
          {
            label: "Genres",
            value:
              state.genres.map((g) => GENRE_LABELS[g]).join(", ") || "—",
          },
          { label: "Post Types", value: state.postTypes.join(", ") || "—" },
          { label: "Content Source", value: state.contentSource.join(", ") || "—" },
          {
            label: "Frequency",
            value: state.frequency ? FREQUENCY_LABELS[state.frequency] : "—",
          },
          {
            label: "Custom Days",
            value:
              state.frequency === "CUSTOM" && state.frequencyDays.length > 0
                ? state.frequencyDays.map((d) => DAY_LABELS[d]).join(", ")
                : state.frequency === "CUSTOM"
                ? "—"
                : null,
          },
          { label: "Post Time", value: state.postTime },
        ]
          .filter((row) => row.value !== null)
          .map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-right">{row.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
