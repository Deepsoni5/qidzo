import {
  FileText,
  Sparkles,
  Rocket,
  Calendar,
  Users,
  Award,
} from "lucide-react";

export default function SchoolExamsPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 animate-in fade-in duration-700">
      <div className="max-w-2xl mx-auto text-center px-6">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-sunshine-yellow/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-[32px] bg-gradient-to-br from-sunshine-yellow via-hot-pink to-brand-purple p-1 shadow-2xl shadow-sunshine-yellow/20">
            <div className="w-full h-full rounded-[28px] bg-white flex items-center justify-center">
              <FileText className="w-16 h-16 text-sunshine-yellow" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-grass-green rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black font-nunito text-gray-900 mb-4 tracking-tight">
          Exams Portal
          <span className="block text-2xl sm:text-3xl text-sunshine-yellow mt-2">
            Coming Soon! 🚀
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg font-bold text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto">
          We're building something amazing! Soon you'll be able to create,
          manage, and conduct online exams for your students right here.
        </p>

        {/* Features Preview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Calendar, label: "Schedule Exams", color: "sky-blue" },
            { icon: Users, label: "Track Students", color: "brand-purple" },
            { icon: Award, label: "Auto Grading", color: "grass-green" },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] p-6 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg"
            >
              <div
                className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center`}
                style={{
                  backgroundColor:
                    feature.color === "sky-blue"
                      ? "#0EA5E910"
                      : feature.color === "brand-purple"
                        ? "#8B5CF610"
                        : "#10B98110",
                }}
              >
                <feature.icon
                  className="w-6 h-6"
                  style={{
                    color:
                      feature.color === "sky-blue"
                        ? "#0EA5E9"
                        : feature.color === "brand-purple"
                          ? "#8B5CF6"
                          : "#10B981",
                  }}
                />
              </div>
              <p className="text-sm font-black text-gray-700">
                {feature.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-sky-blue/10 via-brand-purple/10 to-hot-pink/10 rounded-[32px] p-8 border border-gray-100">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Rocket className="w-5 h-5 text-hot-pink" />
            <p className="text-sm font-black text-gray-700 uppercase tracking-widest">
              Under Development
            </p>
          </div>
          <p className="text-sm font-bold text-gray-600 leading-relaxed">
            Our team is working hard to bring you the best exam management
            experience. Stay tuned for updates!
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/school/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-sky-blue hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
