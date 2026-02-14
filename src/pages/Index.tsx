import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Wrench, Battery, Fuel, Truck, Key, AlertTriangle,
  ArrowRight, Clock, Shield, Phone, User, LogOut, Menu,
  ChevronRight, Star, Zap, Navigation, CheckCircle,
  Home, FileText, Settings, Wrench as WrenchIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const services = [
  { icon: Wrench, title: "Flat Tire", color: "hsl(24 95% 53%)" },
  { icon: Battery, title: "Battery", color: "hsl(142 71% 45%)" },
  { icon: Fuel, title: "Fuel", color: "hsl(38 92% 50%)" },
  { icon: Truck, title: "Towing", color: "hsl(222 47% 50%)" },
  { icon: Key, title: "Lockout", color: "hsl(280 65% 60%)" },
  { icon: AlertTriangle, title: "Accident", color: "hsl(0 84% 60%)" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isMechanic } = useUserRole();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App Status Bar */}
      <div className="bg-primary px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
            <MapPin className="w-4 h-4 text-accent-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-primary-foreground">RoadRescue</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => navigate("/my-requests")}
              className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center"
            >
              <User className="w-4 h-4 text-primary-foreground" />
            </button>
          ) : (
            <Button variant="ghost" size="sm" className="text-primary-foreground h-8 px-3 text-xs" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Hero Card */}
        <div className="bg-hero-gradient px-4 pt-6 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-primary-foreground/70">Available 24/7</span>
          </div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground leading-tight mb-2">
            Need Roadside Help?
          </h1>
          <p className="text-sm text-primary-foreground/60 mb-6">
            Certified mechanics near you, average 15 min response.
          </p>

          <Button
            variant="hero"
            size="lg"
            className="w-full group text-base"
            onClick={() => navigate("/request")}
          >
            <Zap className="w-5 h-5 mr-2" />
            Confirm Request
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Clock, value: "15 min", label: "Response" },
              { icon: Shield, value: "500+", label: "Mechanics" },
              { icon: Star, value: "4.9★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/5 rounded-xl p-3 text-center border border-primary-foreground/10">
                <stat.icon className="w-4 h-4 text-accent mx-auto mb-1" />
                <p className="text-sm font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-[10px] text-primary-foreground/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="px-4 -mt-5">
          <Card className="border-2 border-border shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-base text-foreground">Services</h2>
                <span className="text-xs text-muted-foreground">Tap to request</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {services.map((service) => (
                  <button
                    key={service.title}
                    onClick={() => navigate("/request")}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors active:scale-95"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${service.color}15` }}
                    >
                      <service.icon className="w-5 h-5" style={{ color: service.color }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{service.title}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="px-4 mt-6">
          <h2 className="font-heading font-bold text-base text-foreground mb-3">How It Works</h2>
          <div className="space-y-3">
            {[
              { icon: MapPin, step: "1", title: "Share Location", desc: "GPS auto-detects where you are" },
              { icon: Navigation, step: "2", title: "Pick Service", desc: "Choose what help you need" },
              { icon: CheckCircle, step: "3", title: "Track & Relax", desc: "Watch your mechanic arrive live" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-xs font-bold text-accent bg-accent/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                  {item.step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Highlight */}
        <div className="px-4 mt-6">
          <h2 className="font-heading font-bold text-base text-foreground mb-3">What Drivers Say</h2>
          <Card className="border-2 border-border">
            <CardContent className="p-4">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-3 leading-relaxed">
                "My car broke down at midnight. Within 12 minutes, a mechanic arrived and fixed my battery. Lifesaving service!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-accent-foreground text-xs font-bold">
                  RK
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Rajesh Kumar</p>
                  <p className="text-[10px] text-muted-foreground">Business Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Call Card */}
        <div className="px-4 mt-6 mb-4">
          <div className="bg-hero-gradient rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary-foreground">Emergency?</p>
              <p className="text-xs text-primary-foreground/60">Call us anytime, 24/7</p>
            </div>
            <Button variant="hero" size="sm" className="gap-2" asChild>
              <a href="tel:1800ROAD">
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </Button>
          </div>
        </div>

        {/* Role-based Quick Access */}
        {(isMechanic || isAdmin) && (
          <div className="px-4 mb-4">
            <h2 className="font-heading font-bold text-base text-foreground mb-3">Quick Access</h2>
            <div className="space-y-2">
              {isMechanic && (
                <button
                  onClick={() => navigate("/mechanic")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-foreground">Mechanic Dashboard</p>
                    <p className="text-xs text-muted-foreground">View & manage requests</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-foreground">Admin Dashboard</p>
                    <p className="text-xs text-muted-foreground">Manage users & roles</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50 px-2 py-1 safe-area-bottom">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-0.5 py-2 px-3 text-accent">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/request")}
            className="flex flex-col items-center gap-0.5 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-medium">Request</span>
          </button>
          <button
            onClick={() => navigate(user ? "/my-requests" : "/auth")}
            className="flex flex-col items-center gap-0.5 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button
            onClick={() => navigate(user ? "/my-requests" : "/auth")}
            className="flex flex-col items-center gap-0.5 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
