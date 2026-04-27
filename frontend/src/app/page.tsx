import Link from 'next/link';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  FileText, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">U</div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">UOP</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 border border-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            Unified Operations Platform is live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mb-6 leading-tight">
            Manage your business, learning, and communication <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">in one place</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            The all-in-one SaaS platform that brings your CRM, employee management, LMS, and team communication into a single, unified workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
              Login to workspace
            </Link>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="w-full max-w-6xl mx-auto px-6 mb-32">
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 sm:p-4 bg-opacity-50 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-indigo-50/50 -z-10" />
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex flex-col h-[400px] md:h-[600px]">
              {/* Mock Browser/Dashboard Header */}
              <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="h-6 w-64 bg-slate-100 rounded-md mx-auto" />
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Mock Sidebar */}
                <div className="w-48 md:w-64 border-r border-slate-200 bg-white hidden sm:flex flex-col p-4 gap-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-8 bg-slate-100 rounded-md w-full" />
                  ))}
                </div>
                {/* Mock Content */}
                <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50 overflow-hidden">
                  <div className="h-8 w-48 bg-slate-200 rounded-md" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                         <div className="h-4 w-24 bg-slate-100 rounded" />
                         <div className="h-8 w-16 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                     <div className="h-12 border-b border-slate-100 flex items-center px-4">
                       <div className="h-4 w-32 bg-slate-100 rounded" />
                     </div>
                     <div className="flex-1 p-4 flex flex-col gap-3">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="h-12 bg-slate-50 rounded-lg w-full" />
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-white py-24 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your business</h2>
              <p className="text-lg text-slate-600">Powerful, interconnected modules designed to eliminate silos and boost your team's productivity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Building2 className="w-6 h-6 text-blue-600" />, title: "CRM", desc: "Manage leads, track pipelines, and close more deals with our intuitive CRM." },
                { icon: <GraduationCap className="w-6 h-6 text-indigo-600" />, title: "LMS", desc: "Create courses, manage students, and track learning progress effortlessly." },
                { icon: <Users className="w-6 h-6 text-teal-600" />, title: "Employee Management", desc: "Centralize your HR operations, attendance, and employee records." },
                { icon: <FileText className="w-6 h-6 text-emerald-600" />, title: "Document Tracking", desc: "Store, share, and track all your important business documents securely." },
                { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, title: "Unified Communication", desc: "Connect your team with real-time messaging, announcements, and alerts." }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How UOP Works</h2>
            <p className="text-lg text-slate-600">A seamless flow from lead acquisition to team operations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Capture Leads", desc: "Bring in prospects through integrated CRM forms." },
              { step: "02", title: "Convert", desc: "Turn leads into active students or employees." },
              { step: "03", title: "Manage Options", desc: "Assign courses, tasks, and manage operations." },
              { step: "04", title: "Track Success", desc: "Monitor everything in one unified dashboard." }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-black text-slate-100 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-4 w-8 h-[2px] bg-slate-200" />}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-slate-900 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Start using UOP today</h2>
            <p className="text-xl text-slate-300 mb-10">Join forward-thinking companies running their operations on UOP.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center">
                Create Free Account
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white rounded-xl font-medium text-lg hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-slate-50 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">U</div>
              <span className="font-bold text-lg text-slate-900">UOP</span>
            </div>
            <p className="text-slate-500 max-w-sm">
              Unified Operations Platform.<br/> Manage your CRM, LMS, HR, and Communication from a single source of truth.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-slate-500 hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link href="/login" className="text-slate-500 hover:text-blue-600 transition-colors">Login</Link></li>
              <li><Link href="/signup" className="text-slate-500 hover:text-blue-600 transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Contact</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-slate-200 text-center md:text-left text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Unified Operations Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-900">Twitter</a>
            <a href="#" className="hover:text-slate-900">LinkedIn</a>
            <a href="#" className="hover:text-slate-900">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
