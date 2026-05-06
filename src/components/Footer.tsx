import { Mail, Phone, MapPin, Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { DisclaimerBlock } from "@/components/legal/DisclaimerBlock";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white/80">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <img
              src="/rav-logo.svg"
              alt="Rent-A-Vacation"
              className="h-14 md:h-16 w-auto select-none"
              draggable={false}
            />
            <span className="font-display font-bold text-xl text-white">Rent-A-Vacation</span>
          </Link>
            <p className="text-white/60 mb-6 max-w-sm leading-relaxed">
              The open marketplace for vacation rentals. Rent directly from verified timeshare owners, make an offer on any listing, or post a wish and let owners send you offers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">For Renters</h4>
            <ul className="space-y-3">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link to="/marketplace?tab=wishes" className="hover:text-white transition-colors">Post a Wish</Link></li>
              <li><Link to="/rentals" className="hover:text-white transition-colors">Browse Rentals</Link></li>
              <li><Link to="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
              <li><Link to="/user-guide" className="hover:text-white transition-colors">User Guide</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">For Owners</h4>
            <ul className="space-y-3">
              <li><Link to="/list-property" className="hover:text-white transition-colors">List Your Property</Link></li>
              <li><Link to="/how-it-works#for-owners" className="hover:text-white transition-colors">Owner Resources</Link></li>
              <li><Link to="/how-it-works#pricing" className="hover:text-white transition-colors">Pricing & Fees</Link></li>
              <li><Link to="/how-it-works#success-stories" className="hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Owner FAQs</Link></li>
              <li><Link to="/tools" className="hover:text-white transition-colors">Free Tools</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:support@rent-a-vacation.com" className="flex items-start gap-3 hover:text-white transition-colors">
                  <Mail className="w-5 h-5 mt-0.5 text-primary" />
                  <span>support@rent-a-vacation.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+18007280800" className="flex items-start gap-3 hover:text-white transition-colors">
                  <Phone className="w-5 h-5 mt-0.5 text-primary" />
                  <span>1-800-RAV-0800</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-primary" />
                <span>Jacksonville, FL, United States</span>
              </li>
              <li>
                <Link to="/contact" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-sm font-medium mt-2">
                  Contact Form →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <DisclaimerBlock
            id="trademark"
            variant="minimal"
            className="text-xs text-white/40 text-center mb-3 leading-relaxed max-w-4xl mx-auto"
          />
          <DisclaimerBlock
            id="8.1"
            variant="minimal"
            className="text-xs text-white/40 text-center mb-3 leading-relaxed max-w-4xl mx-auto"
          />
          <DisclaimerBlock
            id="8.2"
            variant="minimal"
            className="text-xs text-white/40 text-center mb-6 leading-relaxed max-w-4xl mx-auto"
          />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-white/50">
              © 2026 Rent-A-Vacation. A Techsilon Group Company. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Gavel className="w-4 h-4 text-primary" />
              <span>A Marketplace for Renters and Owners</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/about" className="text-white/50 hover:text-white transition-colors">About</Link>
              <Link to="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-white/50 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="text-center mt-4">
            <span className="text-xs text-white/30 font-mono" title={`Build ${__BUILD_NUMBER__} · ${__BUILD_HASH__} · ${__BUILD_TIME__}`}>
              v{__APP_VERSION__} · {new Date(__BUILD_TIME__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {__BUILD_HASH__}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
