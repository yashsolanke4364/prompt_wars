"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-navy-900">
                Scholarship<span className="text-teal-500">Saathi</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-navy-600 hover:text-teal-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-navy-600 hover:text-teal-600 font-medium transition-colors">How it Works</a>
              <a href="#transparency" className="text-navy-600 hover:text-teal-600 font-medium transition-colors">Transparency</a>
              <Link href="/dashboard" className="btn-primary text-sm py-2 px-5">
                Get Started →
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-navy-600"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-navy-100 animate-fadeIn">
              <div className="flex flex-col gap-3">
                <a href="#features" className="px-4 py-2 text-navy-600 hover:text-teal-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="px-4 py-2 text-navy-600 hover:text-teal-600 font-medium" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
                <a href="#transparency" className="px-4 py-2 text-navy-600 hover:text-teal-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Transparency</a>
                <Link href="/dashboard" className="btn-primary text-sm mx-4" onClick={() => setMobileMenuOpen(false)}>
                  Get Started →
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-teal-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-400 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 rounded-full border border-teal-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-sm font-medium">AI-Powered Scholarship Matching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Find Scholarships
            <br />
            <span className="bg-gradient-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent">
              You Actually Qualify For
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-navy-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop searching through hundreds of scholarships. Tell us about yourself,
            and our intelligent matching engine finds your best opportunities with
            AI-powered personalized guidance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 shadow-lg shadow-teal-500/20">
              Check My Eligibility
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a href="#how-it-works" className="btn-outline border-navy-600 text-navy-200 hover:border-teal-400 hover:text-teal-300 text-lg px-8 py-4">
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "12+", label: "Demo Scholarships" },
              { value: "6", label: "Categories Covered" },
              { value: "<50ms", label: "Matching Speed" },
              { value: "100%", label: "Rule Transparency" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-navy-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
              Everything You Need to Secure Funding
            </h2>
            <p className="text-lg text-navy-500 max-w-2xl mx-auto">
              From finding the right scholarships to tracking your applications,
              ScholarshipSaathi has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Smart Matching",
                description:
                  "Deterministic eligibility rules match your profile against scholarship criteria. No guesswork — clear eligible, potential, or not-eligible results.",
              },
              {
                icon: "🤖",
                title: "AI Guidance",
                description:
                  "Gemini AI explains your results in simple language, creates personalized action plans, and generates document checklists tailored to you.",
              },
              {
                icon: "📋",
                title: "Application Tracker",
                description:
                  "Save scholarships, track application status, add notes, and monitor your progress from discovery to submission.",
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                description:
                  "Your data stays local in demo mode. API keys are server-side only. No student data is shared with third parties.",
              },
              {
                icon: "✅",
                title: "Verified Data Labels",
                description:
                  "Every scholarship clearly shows its verification status and source. Demo data is never presented as verified government schemes.",
              },
              {
                icon: "📊",
                title: "Performance Dashboard",
                description:
                  "Track your profile completion, eligible matches, upcoming deadlines, and application progress at a glance.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card p-8 group hover:border-teal-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-navy-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-navy-400 max-w-2xl mx-auto">
              Four simple steps to find and track your scholarship opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Complete Your Profile",
                description:
                  "Enter your academic details, course, category, income, and state. The more you fill, the more accurate your matches.",
              },
              {
                step: "02",
                title: "Get Instant Matches",
                description:
                  "Our deterministic engine evaluates your profile against every scholarship's eligibility criteria in milliseconds.",
              },
              {
                step: "03",
                title: "Receive AI Guidance",
                description:
                  "Gemini AI explains your results in plain language, suggests next steps, and creates a personalized document checklist.",
              },
              {
                step: "04",
                title: "Track & Apply",
                description:
                  "Save matched scholarships, track application status, gather documents, and stay on top of deadlines.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-navy-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section id="transparency" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-8 sm:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
                  Transparency & AI Disclosure
                </h2>
                <p className="text-navy-500">Important information about how this platform works</p>
              </div>
            </div>

            <div className="space-y-4 text-navy-600 leading-relaxed">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="font-semibold text-purple-800 mb-1">📌 Demo Data Notice</p>
                <p className="text-purple-700 text-sm">
                  All scholarships in this platform are labeled as <strong>DEMO DATA</strong> and
                  are illustrative examples only. They do not represent current verified government
                  schemes, actual amounts, or real application deadlines.
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <p className="font-semibold text-teal-800 mb-1">🤖 AI Usage</p>
                <p className="text-teal-700 text-sm">
                  This platform uses Google Gemini AI to explain eligibility results and generate
                  action plans. AI does not determine eligibility — that is handled by deterministic
                  rules. AI output is validated against the structured dataset and never overrides
                  rule-based results.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="font-semibold text-amber-800 mb-1">🔒 Data Privacy</p>
                <p className="text-amber-700 text-sm">
                  In demo mode, all data is stored locally in your browser using localStorage.
                  No student data is transmitted to external servers except for AI analysis
                  (which sends only profile fields, not personal identifiers).
                </p>
              </div>

              <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
                <p className="font-semibold text-navy-800 mb-1">📝 Application Tracking</p>
                <p className="text-navy-700 text-sm">
                  The application tracker helps you organize your process. It does not submit
                  applications to any government portal. Always apply through official channels
                  like <a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">scholarships.gov.in</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-navy-900 to-navy-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Scholarships?
          </h2>
          <p className="text-lg text-navy-300 mb-8">
            Complete your profile in under 2 minutes and discover opportunities
            matched to your exact criteria.
          </p>
          <Link href="/dashboard" className="btn-primary text-lg px-10 py-4 shadow-lg shadow-teal-500/25">
            Start Matching — It&apos;s Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-navy-950 border-t border-navy-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-sm text-navy-400">
              ScholarshipSaathi AI — Demo Application
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/evaluate" className="text-sm text-navy-500 hover:text-teal-400 transition-colors">
              Evaluation
            </Link>
            <a href="#transparency" className="text-sm text-navy-500 hover:text-teal-400 transition-colors">
              Transparency
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
