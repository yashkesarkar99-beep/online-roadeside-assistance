import { MapPin, UserCheck, Navigation, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    step: "01",
    title: "Share Your Location",
    description: "Open the app and let GPS automatically detect your location, or enter it manually.",
  },
  {
    icon: UserCheck,
    step: "02",
    title: "Select Service",
    description: "Choose the type of assistance you need - flat tire, battery, fuel, or towing.",
  },
  {
    icon: Navigation,
    step: "03",
    title: "Track Mechanic",
    description: "Watch your assigned mechanic approach in real-time on the live map.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Get Fixed & Go",
    description: "Mechanic arrives, fixes your issue, and you're back on the road safely.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
            How It Works
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Help in 4 Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting roadside assistance has never been easier. Our streamlined process 
            ensures help reaches you in the shortest possible time.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((item, index) => (
              <div 
                key={item.step}
                className="relative group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="bg-card rounded-2xl p-6 lg:p-8 shadow-card text-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-accent-foreground font-bold text-sm">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent-gradient transition-all duration-300">
                    <item.icon className="w-8 h-8 text-accent group-hover:text-accent-foreground transition-colors" />
                  </div>

                  <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {[
            { value: "15K+", label: "Successful Rescues" },
            { value: "500+", label: "Verified Mechanics" },
            { value: "15 min", label: "Avg. Response Time" },
            { value: "4.9★", label: "Customer Rating" },
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card shadow-soft"
            >
              <div className="font-heading text-3xl md:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
