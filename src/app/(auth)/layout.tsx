export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
            UG
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Urban Governance</h1>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Civic Issue Reporting</p>
        </div>
        {children}
      </div>
    </div>
  );
}
