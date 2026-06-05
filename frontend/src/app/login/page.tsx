import { ButtonLink } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6">
      <p className="text-4xl font-semibold tracking-tight text-white">SafarAI</p>
      <p className="mt-3 max-w-sm text-center text-[#a1a1aa]">
        Safer public transit for Indian commuters — especially women traveling alone.
      </p>
      <ButtonLink href="/home" size="lg" className="mt-10">
        Enter demo
      </ButtonLink>
    </div>
  );
}
