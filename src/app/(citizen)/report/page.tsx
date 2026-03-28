import { ReportForm } from "@/components/forms/ReportForm";

export default function ReportPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report a Civic Issue</h1>
        <p className="text-gray-500 mt-1">
          AI-powered complaint filing. Gemini will classify and prioritize your report.
        </p>
      </div>
      <ReportForm />
    </div>
  );
}
