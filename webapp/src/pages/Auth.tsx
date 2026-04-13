import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Instagram, Zap, ArrowRight, Mail, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function Auth() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setStep("otp");
      toast.success("OTP sent! Check your email.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      await authClient.signIn.emailOtp({
        email,
        otp,
      });
      toast.success("Welcome to InstaFlow!");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message ?? "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - desktop only */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-orange-400/30" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(168,85,247,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(249,115,22,0.15) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full">
          <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Instagram className="w-10 h-10 text-white" />
            </div>
            <h1
              className="text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              InstaFlow
            </h1>
            <p className="text-xl text-white/80 leading-relaxed mb-12">
              Automate your Instagram.
              <br />
              <span className="text-white font-semibold">Amplify your reach.</span>
            </p>
            <div className="grid grid-cols-1 gap-4 text-left">
              {[
                {
                  icon: "🤖",
                  title: "AI-Powered Content",
                  desc: "Generate stunning posts & reels automatically",
                },
                {
                  icon: "📅",
                  title: "Smart Scheduling",
                  desc: "Post at the perfect time, every time",
                },
                {
                  icon: "📊",
                  title: "Campaign Management",
                  desc: "Run multiple campaigns effortlessly",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{feature.title}</p>
                    <p className="text-white/60 text-xs mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center p-6 md:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Instagram className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            InstaFlow
          </h1>
        </div>

        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {step === "email" ? "Sign in to InstaFlow" : "Check your email"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {step === "email"
                ? "Enter your email to receive a one-time password"
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {step === "email" ? (
            <form
              key="email-form"
              onSubmit={handleSendOtp}
              className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary h-11"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white border-0 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Send OTP
              </Button>
            </form>
          ) : (
            <form
              key="otp-form"
              onSubmit={handleVerifyOtp}
              className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300"
            >
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">
                  One-time password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 bg-secondary border-border focus:border-primary h-11 tracking-widest text-center text-lg font-mono"
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white border-0 transition-opacity"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Verify &amp; Login
              </Button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Wrong email? Go back
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
