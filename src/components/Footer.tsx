import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">RoadRescue</span>
            </div>
            <p className="text-primary-foreground/70 mb-6 leading-relaxed">
              Your trusted partner for roadside emergencies. Available 24/7 with certified mechanics nationwide.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-primary-foreground/70 hover:text-accent transition-colors">Services</a></li>
              <li><a href="#how-it-works" className="text-primary-foreground/70 hover:text-accent transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="text-primary-foreground/70 hover:text-accent transition-colors">Testimonials</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Pricing</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Flat Tire Change</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Battery Jump Start</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Fuel Delivery</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Towing Service</a></li>
              <li><a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">Lockout Assistance</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">1-800-ROAD-HELP</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-primary-foreground/70">help@roadrescue.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-1" />
                <span className="text-primary-foreground/70">
                  Available across all major cities in India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © 2025 RoadRescue. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
