import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Business Owner",
    avatar: "RK",
    rating: 5,
    text: "My car broke down at midnight on the highway. Within 12 minutes, a mechanic arrived and fixed my battery issue. Absolutely lifesaving service!",
  },
  {
    name: "Priya Sharma",
    role: "IT Professional",
    avatar: "PS",
    rating: 5,
    text: "The GPS tracking feature is amazing. I could see exactly when the mechanic would arrive. No more waiting in uncertainty. Highly recommended!",
  },
  {
    name: "Amit Patel",
    role: "Sales Executive",
    avatar: "AP",
    rating: 5,
    text: "Got a flat tire during an important meeting day. RoadRescue sent help immediately. Professional service and transparent pricing. Will use again!",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
            Testimonials
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers say about their experience with RoadRescue.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="border-2 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 lg:p-8">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-accent/20 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-gradient flex items-center justify-center text-accent-foreground font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
