export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-black font-nunito text-gray-800 tracking-tight">
          Loading Magic...
        </h2>
        <div className="flex gap-2">
            <span className="w-3 h-3 bg-brand-purple rounded-full animate-bounce delay-0"></span>
            <span className="w-3 h-3 bg-hot-pink rounded-full animate-bounce delay-100"></span>
            <span className="w-3 h-3 bg-sky-blue rounded-full animate-bounce delay-200"></span>
        </div>
      </div>
    </div>
  );
}
