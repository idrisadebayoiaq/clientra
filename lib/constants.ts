export const SERVICES = [
  { key: "full_stack", label: "Full-stack development" },
  { key: "frontend", label: "Frontend development" },
  { key: "backend", label: "Backend development" },
  { key: "mobile", label: "Mobile app development" },
  { key: "ui_ux", label: "UI/UX design" },
  { key: "website", label: "Website development" },
  { key: "ecommerce", label: "E-commerce development" },
  { key: "seo", label: "SEO" },
  { key: "digital_marketing", label: "Digital marketing" },
  { key: "automation", label: "Automation" },
  { key: "ai_integration", label: "AI integration" },
  { key: "branding", label: "Branding" },
  { key: "graphic_design", label: "Graphic design" },
  { key: "copywriting", label: "Copywriting" },
  { key: "video_editing", label: "Video editing" },
  { key: "other", label: "Other" },
] as const;

export const TARGET_AUDIENCES = [
  { key: "startups", label: "Startups" },
  { key: "small_businesses", label: "Small businesses" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "agencies", label: "Agencies" },
  { key: "saas", label: "SaaS companies" },
  { key: "local", label: "Local businesses" },
  { key: "enterprise", label: "Enterprise" },
  { key: "individuals", label: "Individuals" },
] as const;

export const PIPELINE_STAGES = [
  { key: "new", label: "New" },
  { key: "analyzing", label: "Analyzing" },
  { key: "qualified", label: "Qualified" },
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "interested", label: "Interested" },
  { key: "meeting", label: "Meeting" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

export const FRESHNESS_OPTIONS = [
  { hours: 24, label: "Last 24 hours" },
  { hours: 48, label: "Last 48 hours" },
  { hours: 72, label: "Last 72 hours" },
] as const;

export const APP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/discover", label: "Discover", icon: "Compass" },
  { href: "/websites", label: "Website Opportunities", icon: "Globe" },
  { href: "/analyze", label: "Analyze a website", icon: "Search" },
  { href: "/problems", label: "Problem Opportunities", icon: "MessageSquareWarning" },
  { href: "/jobs", label: "Job Opportunities", icon: "Briefcase" },
  { href: "/leads", label: "Leads", icon: "Users" },
  { href: "/crm", label: "CRM", icon: "Kanban" },
  { href: "/inbox", label: "Inbox", icon: "Inbox" },
  { href: "/campaigns", label: "Campaigns", icon: "Megaphone" },
  { href: "/analytics", label: "Analytics", icon: "ChartColumn" },
  { href: "/integrations", label: "Integrations", icon: "Plug" },
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/billing", label: "Billing", icon: "CreditCard" },
  { href: "/help", label: "Help", icon: "CircleHelp" },
] as const;

export const MARKETING_NAV = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    description: "Start discovering opportunities and learn the workflow.",
    features: [
      "Limited opportunity feed",
      "3 AI website analyses / month",
      "Manual outreach composer",
      "Basic CRM",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    description: "For freelancers and independent specialists.",
    features: [
      "Daily opportunity discovery",
      "50 AI analyses / month",
      "Gmail send and reply tracking",
      "Follow-up sequences",
      "Inbox + CRM",
    ],
    highlighted: true,
  },
  {
    key: "agency",
    name: "Agency",
    price: "$149",
    description: "For studios running multiple outreach pipelines.",
    features: [
      "Higher discovery volume",
      "200 AI analyses / month",
      "Campaigns and team-ready CRM",
      "Multiple connected inboxes",
      "Priority support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For larger teams that need controls and dedicated sources.",
    features: [
      "Custom source adapters",
      "SSO-ready architecture",
      "Audit logs and admin controls",
      "Usage reporting",
      "Dedicated onboarding",
    ],
  },
] as const;
