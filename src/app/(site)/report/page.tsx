import { ReportForm } from "@/components/public/ReportForm";

export const metadata = { title: "Report a problem" };

export default function ReportPage() {
  return (
    <div className="bg-hero">
      <main className="container-page py-8 sm:py-12">
        <ReportForm />
      </main>
    </div>
  );
}
