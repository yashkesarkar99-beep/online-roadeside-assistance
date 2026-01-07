import { Button } from "@/components/ui/button";
import { MapPin, Clock, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-1/3 right-20 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-primary-foreground/80">
                Available 24/7 • Average Response: 15 mins
              </span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight mb-6">
              Stuck on the Road?
              <span className="block text-gradient mt-2">Help is Minutes Away</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-xl mx-auto lg:mx-0">
              Get instant roadside assistance from certified mechanics near you. 
              Flat tires, dead batteries, fuel delivery, and towing — we've got you covered.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button variant="hero" size="xl" className="group" onClick={() => navigate("/request")}>
                Request Assistance
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
                View Services
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-primary-foreground/60">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">15 Min Response</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/60">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Verified Mechanics</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/60">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">GPS Tracking</span>
              </div>
            </div>
          </div>

          {/* Right Content - Map/Location Visual */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative bg-card/10 backdrop-blur-sm rounded-3xl border border-primary-foreground/10 p-6 shadow-2xl">
              {/* Mock Map */}
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {/* Map Grid Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                  }} />
                </div>

                {/* Location Marker */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-accent/20 animate-ping absolute inset-0" />
                  <div className="w-20 h-20 rounded-full bg-accent-gradient flex items-center justify-center relative">
                    <MapPin className="w-10 h-10 text-accent-foreground" />
                  </div>
                </div>

                {/* Mechanic Markers */}
                <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-xs font-bold text-success-foreground">M1</span>
                </div>
                <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                  <span className="text-xs font-bold text-success-foreground">M2</span>
                </div>
                <div className="absolute bottom-1/4 left-1/3 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1.5s' }}>
                  <span className="text-xs font-bold text-success-foreground">M3</span>
                </div>
              </div>

              {/* Status Card */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card rounded-xl shadow-card p-4 min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nearest Mechanic</p>
                    <p className="font-heading font-bold text-foreground">2.3 km away • ETA 8 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
