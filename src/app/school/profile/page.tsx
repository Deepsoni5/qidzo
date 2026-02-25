export default function SchoolProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-brand-purple/10 rounded-3xl flex items-center justify-center text-brand-purple mb-6">
        <Globe className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black font-nunito text-gray-900 mb-2">School Profile</h1>
      <p className="text-gray-500 font-bold max-w-md">Edit your school's public profile, brand colors, and campus information.</p>
      <div className="mt-8 px-6 py-3 bg-gray-100 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-widest">
        Coming Soon
      </div>
    </div>
  );
}

function Globe({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20"/></svg>
    )
}
