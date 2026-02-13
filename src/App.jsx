import { useEffect, useState } from 'react'
import './App.css'
import heroIllustration from './assets/mealbridge.png'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Foundation', path: '/foundation' },
  { label: 'How to help?', path: '/how-to-help' },
  { label: 'Events', path: '/events' },
  { label: 'Contact', path: '/contact' },
]

const staticPages = {
  '/about': {
    kicker: 'About MealBridge',
    title: 'Building smarter food redistribution.',
    text: 'MealBridge connects food donors and NGOs to ensure surplus edible food reaches people quickly and safely.',
    points: [
      'Built for real-time donor-to-NGO coordination.',
      'Focused on reducing edible food waste and response delays.',
      'Designed for community impact with measurable outcomes.',
    ],
  },
  '/foundation': {
    kicker: 'Our Foundation',
    title: 'Mission-first collaboration and execution.',
    text: 'Our foundation model prioritizes dignity, food safety, and fast logistics for every rescue request.',
    points: [
      'Social impact before operational complexity.',
      'Transparent data for meal recovery and waste reduction.',
      'Scalable workflows for colleges, hostels, restaurants, and events.',
    ],
  },
  '/how-to-help': {
    kicker: 'How To Help',
    title: 'Join the food rescue movement.',
    text: 'Support MealBridge as a donor, organizer, or referral partner.',
    points: [
      'List surplus food immediately when available.',
      'Support packaging, pickup, or local distribution.',
      'Refer NGOs and donor organizations in your city.',
    ],
  },
  '/how-it-works': {
    kicker: 'How It Works',
    title: 'Simple flow, faster rescue.',
    text: 'Donors post food details, NGOs request pickups, and AI urgency indicators help prioritize dispatch order.',
    points: [
      'Donor submits food type, quantity, prep time, and location.',
      'NGOs view nearby listings and request suitable pickups.',
      'AI urgency assists teams in reducing spoilage risk.',
    ],
  },
  '/events': {
    kicker: 'Events',
    title: 'Campus and community collaboration.',
    text: 'MealBridge participates in local events to onboard donors and NGOs into one coordinated network.',
    points: [
      'Food waste awareness sessions and demos.',
      'On-site donor registration and partner onboarding.',
      'Hackathon-style response drills for rapid coordination.',
    ],
  },
  '/contact': {
    kicker: 'Contact',
    title: 'Let us connect and coordinate.',
    text: 'Reach out for partnerships, pilot runs, and operational setup in your area.',
    points: [
      'Email: hello@mealbridge.org',
      'Phone: +91 90000 00000',
      'Response window: 9:00 AM to 7:00 PM',
    ],
  },
  '/join': {
    kicker: 'Join Now',
    title: 'Be part of MealBridge.',
    text: 'Whether you are a donor, NGO member, or organizer, we can onboard your role quickly.',
    points: [
      'Register your role and service area.',
      'Get onboarding guidance and workflow access.',
      'Start coordinating food rescue requests.',
    ],
  },
  '/donate': {
    kicker: 'Donate',
    title: 'Support timely food rescue efforts.',
    text: 'Contributions help with packaging supplies, transportation support, and awareness operations.',
    points: [
      'Sustain safe pickup and distribution logistics.',
      'Enable recurring field operations in high-need zones.',
      'Strengthen partner readiness.',
    ],
  },
  '/safety-guidelines': {
    kicker: 'Safety Guidelines',
    title: 'Food safety is non-negotiable.',
    text: 'MealBridge follows practical safety checks before acceptance and handoff.',
    points: [
      'Ensure food is freshly prepared and covered.',
      'Mention prep time and special handling notes.',
      'Use clean containers and safe transport methods.',
    ],
  },
  '/faq': {
    kicker: 'FAQ',
    title: 'Common questions, quick answers.',
    text: 'Get clarity on donor posting, NGO requests, urgency estimation, and coordination timelines.',
    points: [
      'Who can post surplus food?',
      'How does NGO request prioritization work?',
      'How quickly should pickup be scheduled?',
    ],
  },
  '/privacy': {
    kicker: 'Privacy',
    title: 'Data usage with practical safeguards.',
    text: 'We collect minimum operational data needed for matching donors, NGOs, and pickups.',
    points: [
      'Contact details used only for coordination.',
      'Location data used for nearest-match efficiency.',
      'Operational records retained for impact analytics.',
    ],
  },
  '/terms': {
    kicker: 'Terms',
    title: 'Shared responsibilities for reliable use.',
    text: 'All participants are expected to provide accurate data, timely responses, and safe handoff practices.',
    points: [
      'Donor listing details must be accurate.',
      'NGO request timelines should be realistic.',
      'All users should follow safety and compliance norms.',
    ],
  },
}

function getRouteFromHash() {
  const path = window.location.hash.replace(/^#/, '') || '/'
  return path.startsWith('/') ? path : `/${path}`
}

function App() {
  const [route, setRoute] = useState(getRouteFromHash())

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const whyCards = [
    {
      title: 'Rapid Local Matching',
      description:
        'Donors and NGOs connect fast based on location and immediate availability.',
    },
    {
      title: 'AI Priority Routing',
      description:
        'Urgency levels guide pickups so highly perishable food is rescued first.',
    },
    {
      title: 'Traceable Social Impact',
      description:
        'Each listing and request is tracked to measure meals saved and waste prevented.',
    },
  ]

  const currentStaticPage = staticPages[route]
  const isHome = route === '/'

  return (
    <div className="page-shell">
      <main className="page-card">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">RF</span>
            <div>
              <p className="brand-name">MealBridge</p>
              <p className="brand-subtitle">Food Redistribution Portal</p>
            </div>
          </div>
          <nav className="menu">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={`#${link.path}`}
                className={route === link.path ? 'active-link' : ''}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a className="cta-mini" href="#/join">
            Join Now
          </a>
        </header>

        {isHome ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="hero-kicker">Be The Reason</p>
                <h1>Someone Smiles Today!</h1>
                <p>
                  ReFood helps donors and NGOs coordinate surplus food rescue in real
                  time, with AI-based urgency guidance to reduce edible food waste.
                </p>
                <div className="hero-actions">
                  <a href="#/donate" className="hero-btn">
                    Donate Now
                    <span className="arrow-badge" aria-hidden="true">
                      <svg viewBox="0 0 16 16" className="arrow-icon">
                        <path
                          d="M3.5 8h7.2M8.9 5.3L12.2 8l-3.3 2.7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
              <div className="hero-panel">
                <img
                  src={heroIllustration}
                  alt="Food donation illustration"
                  className="hero-illustration"
                />
              </div>
            </section>

            <section id="why-ref-food" className="why-section">
              <h2>Why Choose Us?</h2>
              <div className="why-grid">
                {whyCards.map((card, index) => (
                  <article
                    key={card.title}
                    className={`why-item ${index === 1 ? 'why-item-focus' : ''}`}
                  >
                    <div className="why-icon" aria-hidden="true">
                      {index + 1}
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="static-page">
            <p className="static-kicker">{currentStaticPage?.kicker || 'MealBridge'}</p>
            <h1>{currentStaticPage?.title || 'Page Not Found'}</h1>
            <p className="static-text">
              {currentStaticPage?.text ||
                'This route is not available yet. Please use the main navigation.'}
            </p>
            {currentStaticPage && (
              <div className="static-points">
                {currentStaticPage.points.map((point) => (
                  <article key={point} className="static-point">
                    {point}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className={`site-footer ${isHome ? 'home-footer-gap' : ''}`}>
          <div className="footer-brand">
            <p className="footer-title">MealBridge</p>
            <p>
              AI-assisted food redistribution portal helping donors and NGOs rescue
              surplus food in time.
            </p>
          </div>
          <div className="footer-links">
            <p>Platform</p>
            <a href="#/donate">Donate</a>
            <a href="#/join">Join Now</a>
            <a href="#" title="Feature page not included in this static setup">
              NGO Dashboard
            </a>
            <a href="#" title="Feature page not included in this static setup">
              Donor Listing
            </a>
          </div>
          <div className="footer-links">
            <p>Company</p>
            <a href="#/about">About</a>
            <a href="#/how-it-works">How It Works</a>
            <a href="#/events">Events</a>
            <a href="#/contact">Contact</a>
          </div>
          <div className="footer-links">
            <p>Resources</p>
            <a href="#/safety-guidelines">Safety Guidelines</a>
            <a href="#/faq">FAQ</a>
            <a href="#/privacy">Privacy</a>
            <a href="#/terms">Terms</a>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
