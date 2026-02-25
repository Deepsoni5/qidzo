export default function SchoolAdmissionsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-grass-green/10 rounded-3xl flex items-center justify-center text-grass-green mb-6">
        <Users className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black font-nunito text-gray-900 mb-2">Admissions</h1>
      <p className="text-gray-500 font-bold max-w-md">Track parent inquiries, manage admission forms, and grow your student body.</p>
      <div className="mt-8 px-6 py-3 bg-gray-100 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest">
        Coming Soon
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )
}
