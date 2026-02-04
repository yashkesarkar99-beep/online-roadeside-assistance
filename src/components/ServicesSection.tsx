import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Battery, Fuel, Truck, Key, AlertTriangle } from "lucide-react";

const services = [
  {
    icon: Wrench,
    title: "Flat Tire Change",
    description: "Quick tire replacement or repair to get you back on the road safely.",
    popular: true,
  },
  {
    icon: Battery,
    title: "Battery Jump Start",
    description: "Dead battery? We'll jump-start your vehicle or replace the battery.",
    popular: false,
  },
  {
    icon: Fuel,
    title: "Fuel Delivery",
    description: "Emergency fuel delivery when you run out of gas unexpectedly.",
    popular: false,
  },
  {
    icon: Truck,
    title: "Towing Service",
    description: "Safe and reliable towing to your preferred location or workshop.",
    popular: true,
  },
  {
    icon: Key,
    title: "Lockout Assistance",
    description: "Locked out of your vehicle? Our experts will help you gain access.",
    popular: false,
  },
  {
    icon: AlertTriangle,
    title: "Accident Recovery",
    description: "Complete accident recovery and coordination with insurance.",
    popular: false,
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
            Our Services
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Complete Roadside Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From flat tires to major breakdowns, our certified mechanics are equipped 
            to handle any roadside emergency with speed and expertise.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Card 
              key={service.title}
              className={`group relative overflow-hidden border-2 transition-all duration-300 hover:border-accent hover:shadow-card ${
                service.popular ? 'border-accent/50' : 'border-border'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {service.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent-gradient text-accent-foreground text-xs font-bold">
                  Popular
                </div>
              )}
              <CardContent className="p-6 lg:p-8">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent-gradient transition-all duration-300">
                  <service.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
