import SignInForm from "@/components/auth/SignInForm";

export default function Page() {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 w-full max-w-md mb-8 text-center mt-12">
          <h1 className="text-2xl font-bold text-gray-800 font-nunito">Parent Portal</h1>
        <p className="text-gray-500">Manage your child's learning journey</p>
      </div>

      <div className="z-10 w-full">
        <SignInForm />
      </div>
    </div>
  )
}
