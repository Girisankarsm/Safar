import { ButtonLink } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="app-shell-bg flex min-h-screen flex-col items-center justify-center p-6">
      <p className="font-display text-4xl font-extrabold tracking-tight text-foreground">SafarAI</p>
      <p className="mt-3 max-w-sm text-center text-muted">
        Safer public transit for Indian commuters — especially women traveling alone.
      </p>
      <ButtonLink href="/home" size="lg" className="mt-10">
        Enter demo
      </ButtonLink>
    </div>
  );
}
