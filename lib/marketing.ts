export const FAQS = [
  {
    q: "Is Clientra a freelancer marketplace?",
    a: "No. Clientra is a proactive client acquisition system. It helps you find people and businesses that may need your services, then manage outreach and conversations in one place.",
  },
  {
    q: "Where do opportunities come from?",
    a: "Clientra uses official APIs, permitted feeds, and publicly available information. Empty sources stay empty rather than showing invented results. Social and search feeds will be added later.",
  },
  {
    q: "Can Clientra send emails for me?",
    a: "Yes, after you connect Gmail with Google OAuth. Automatic sending and follow-ups stay off until you explicitly enable them.",
  },
  {
    q: "Does Clientra scrape private social accounts?",
    a: "No. Clientra does not bypass authentication, CAPTCHA, or platform restrictions. Unsupported channels offer copy-and-open-profile workflows only.",
  },
  {
    q: "Are AI scores guaranteed?",
    a: "No. Opportunity scores are estimates based on available signals such as freshness, fit, and contact availability. They are decision support, not facts.",
  },
  {
    q: "What does Gmail access include?",
    a: "Gmail is connected through Google OAuth so Clientra can send authorized outreach, read replies in connected threads, and receive push notifications when configured. Clientra never asks for your Gmail password. You can disconnect at any time.",
  },
  {
    q: "How is login Google different from Gmail connect?",
    a: "Continue with Google signs you into Clientra using the Supabase Auth callback. Connect Gmail is a separate authorization used only to send and read mail through /api/auth/google/callback.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Settings includes Data & Privacy controls, and you can disconnect Gmail at any time. Contact us if you need a full workspace deletion.",
  },
];
