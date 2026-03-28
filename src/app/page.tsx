import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

async function getStats() {
  try {
    const [totalIssues, resolvedIssues, pendingIssues] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: "RESOLVED" } }),
      prisma.issue.count({ where: { status: "PENDING" } }),
    ]);
    return { totalIssues, resolvedIssues, pendingIssues };
  } catch {
    return { totalIssues: 0, resolvedIssues: 0, pendingIssues: 0 };
  }
}

const features = [
  {
    icon: "📸",
    title: "Multimodal Reporting",
    description: "Report issues with images, text, and GPS location for accurate documentation.",
  },
  {
    icon: "🤖",
    title: "AI Classification",
    description: "Gemini AI automatically classifies issues and assesses severity and urgency.",
  },
  {
    icon: "📍",
    title: "Duplicate Detection",
    description: "Geospatial analysis detects and merges duplicate reports within 500m.",
  },
  {
    icon: "⚡",
    title: "Priority Queue",
    description: "MCIA algorithm ranks issues by composite priority for faster resolution.",
  },
  {
    icon: "📊",
    title: "Real-Time Tracking",
    description: "Monitor your complaint status from submission to resolution.",
  },
  {
    icon: "👥",
    title: "Community Upvotes",
    description: "Citizens can upvote existing issues to highlight community priorities.",
  },
];

const categories = [
  { name: "Potholes", icon: "🕳️", color: "bg-orange-100" },
  { name: "Garbage", icon: "🗑️", color: "bg-green-100" },
  { name: "Water Leakage", icon: "💧", color: "bg-blue-100" },
  { name: "Street Lights", icon: "💡", color: "bg-yellow-100" },
  { name: "Sewage", icon: "🚰", color: "bg-gray-100" },
  { name: "Infrastructure", icon: "🏗️", color: "bg-red-100" },
];

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              UG
            </div>
            <span className="font-bold text-lg text-gray-900">Urban Governance</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#categories" className="hover:text-blue-600 transition-colors">Categories</Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
          </nav>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
          AI-Powered Urban Governance
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Report Civic Issues.
          <br />
          <span className="text-blue-600">AI Prioritizes. Cities Improve.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          The AI-Empowered Urban Governance System uses Multimodal Civic Intelligence to
          classify, prioritize, and route civic complaints for faster resolution.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Report an Issue
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="px-8">
                Track My Complaints
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/report">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Report an Issue
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="px-8">
                My Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">{stats.totalIssues.toLocaleString()}</div>
              <div className="text-gray-500 mt-1">Total Issues Reported</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-green-600">{stats.resolvedIssues.toLocaleString()}</div>
              <div className="text-gray-500 mt-1">Issues Resolved</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-orange-600">{stats.pendingIssues.toLocaleString()}</div>
              <div className="text-gray-500 mt-1">Pending Resolution</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart Civic Intelligence</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Powered by Google Gemini AI and the Multimodal Civic Intelligence Algorithm (MCIA)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Report Any Civic Issue</h2>
            <p className="text-gray-600">Our AI handles 10+ categories of urban problems</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className={`${cat.color} rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-sm font-medium text-gray-700">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600">From complaint to resolution in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { step: "1", title: "Report", desc: "Upload image, describe issue, share location" },
            { step: "2", title: "AI Analysis", desc: "Gemini AI classifies and scores your report" },
            { step: "3", title: "Prioritization", desc: "MCIA algorithm ranks your issue in the queue" },
            { step: "4", title: "Resolution", desc: "Authorities act and update status in real-time" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Help Build a Smarter City
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Join thousands of citizens making their city better through AI-powered governance.
          </p>
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Get Started Free
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/report">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Report an Issue Now
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Urban Governance System &copy; {new Date().getFullYear()} | AI-Powered Civic Intelligence</p>
          <p className="mt-1">Built with Next.js, Prisma, Clerk, NeonDB & Google Gemini AI</p>
        </div>
      </footer>
    </div>
  );
}
