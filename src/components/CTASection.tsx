import { Button } from "@/components/ui/button";
import { Phone, ArrowRight, Clock, Shield } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 bg-hero-gradient relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      <div className="absolute top-1/4 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-10 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-8">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/80">
              24/7 Emergency Support Available
            </span>
          </div>

          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-foreground mb-6">
            Don't Get Stranded.
            <span className="block text-gradient mt-2">Get RoadRescue.</span>
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
            Join over 15,000 satisfied drivers who trust RoadRescue for their roadside emergencies. 
            Download the app or call us now for instant assistance.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="xl" className="group">
              Get Help Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" className="gap-2">
              <Phone className="w-5 h-5" />
              Call 1-800-ROAD
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Verified Mechanics</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Clock className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">15 Min Response</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
