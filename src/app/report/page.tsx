import { ReportForm } from "@/components/public/ReportForm";

export const metadata = { title: "Report a problem — CivicOS" };

export default function ReportPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <ReportForm />
    </main>
  );
}
