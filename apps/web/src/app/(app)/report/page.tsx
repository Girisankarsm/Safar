import { redirect } from "next/navigation";

export default function ReportRedirect() {
  redirect("/safety?report=1");
}
