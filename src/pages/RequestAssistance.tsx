import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateAssistanceRequest } from "@/hooks/useAssistanceRequests";
import { 
  MapPin, 
  Wrench, 
  Battery, 
  Fuel, 
  Truck, 
  Key, 
  AlertTriangle,
  Car,
  Phone,
  User,
  Navigation,
  CheckCircle,
  Loader2
} from "lucide-react";

const serviceTypes = [
  { value: "flat-tire", label: "Flat Tire Change", icon: Wrench },
  { value: "battery", label: "Battery Jump Start", icon: Battery },
  { value: "fuel", label: "Fuel Delivery", icon: Fuel },
  { value: "towing", label: "Towing Service", icon: Truck },
  { value: "lockout", label: "Lockout Assistance", icon: Key },
  { value: "accident", label: "Accident Recovery", icon: AlertTriangle },
];

const formSchema = z.object({
  serviceType: z.string().min(1, { message: "Please select a service type" }),
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100, { message: "Name must be less than 100 characters" }),
  phone: z.string().trim().min(10, { message: "Please enter a valid phone number" }).max(15, { message: "Phone number is too long" }),
  location: z.string().trim().min(5, { message: "Please enter your location" }).max(200, { message: "Location must be less than 200 characters" }),
  vehicleMake: z.string().trim().min(2, { message: "Please enter vehicle make" }).max(50, { message: "Vehicle make must be less than 50 characters" }),
  vehicleModel: z.string().trim().min(1, { message: "Please enter vehicle model" }).max(50, { message: "Vehicle model must be less than 50 characters" }),
  vehicleYear: z.string().trim().min(4, { message: "Please enter a valid year" }).max(4, { message: "Please enter a valid year" }),
  vehicleColor: z.string().trim().min(2, { message: "Please enter vehicle color" }).max(30, { message: "Color must be less than 30 characters" }),
  licensePlate: z.string().trim().min(2, { message: "Please enter license plate" }).max(15, { message: "License plate is too long" }),
  description: z.string().trim().max(500, { message: "Description must be less than 500 characters" }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RequestAssistance = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createRequest, isLoading: isSubmitting } = useCreateAssistanceRequest();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: "",
      name: "",
      phone: "",
      location: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleColor: "",
      licensePlate: "",
      description: "",
    },
  });

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("location", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: "Location detected",
            description: "Your GPS coordinates have been captured.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Parse location coordinates if GPS was used
    let locationLat: number | undefined;
    let locationLng: number | undefined;
    
    const coordMatch = data.location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      locationLat = parseFloat(coordMatch[1]);
      locationLng = parseFloat(coordMatch[2]);
    }

    const result = await createRequest({
      serviceType: data.serviceType,
      name: data.name,
      phone: data.phone,
      location: data.location,
      locationLat,
      locationLng,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      vehicleColor: data.vehicleColor,
      description: data.description,
    });

    if (result) {
      setRequestId(result.id);
      setIsSuccess(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "A mechanic will be assigned to you shortly.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto border-2 border-success/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
                  Help is on the Way!
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your request has been submitted. A nearby mechanic will be assigned 
                  and will contact you shortly. Average response time is 15 minutes.
                </p>
                <div className="bg-secondary/50 rounded-xl p-6 mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Your Request ID</p>
                  <p className="font-heading text-2xl font-bold text-foreground font-mono">
                    {requestId ? `#${requestId.slice(0, 8).toUpperCase()}` : "#PENDING"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" onClick={() => requestId && navigate(`/track/${requestId}`)}>
                    Track Your Request
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsSuccess(false);
                    setRequestId(null);
                    form.reset();
                  }}>
                    Submit Another Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mb-4">
              Emergency Assistance
            </span>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Request Roadside Help
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fill out the form below and we'll dispatch a certified mechanic to your location immediately.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Service Selection */}
                <div className="lg:col-span-3">
                  <Card className="border-2 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-accent" />
                        Select Service Type
                      </CardTitle>
                      <CardDescription>
                        Choose the type of assistance you need
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {serviceTypes.map((service) => (
                                  <button
                                    key={service.value}
                                    type="button"
                                    onClick={() => field.onChange(service.value)}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                      field.value === service.value
                                        ? "border-accent bg-accent/10"
                                        : "border-border hover:border-accent/50"
                                    }`}
                                  >
                                    <service.icon className={`w-8 h-8 mb-3 ${
                                      field.value === service.value ? "text-accent" : "text-muted-foreground"
                                    }`} />
                                    <p className="font-semibold text-foreground">{service.label}</p>
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Information */}
                <div className="lg:col-span-1">
                  <Card className="border-2 border-border h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Contact Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                  placeholder="+91 98765 43210" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Location */}
                <div className="lg:col-span-2">
                  <Card className="border-2 border-border h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-accent" />
                        Your Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location / Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Enter your address or landmark" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          Include nearby landmarks for faster location. E.g., "Near XYZ Petrol Pump, Mumbai-Pune Highway"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vehicle Details */}
                <div className="lg:col-span-3">
                  <Card className="border-2 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-accent" />
                        Vehicle Information
                      </CardTitle>
                      <CardDescription>
                        Help us identify your vehicle quickly
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <FormField
                          control={form.control}
                          name="vehicleMake"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Make</FormLabel>
                              <FormControl>
                                <Input placeholder="Toyota" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vehicleModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <FormControl>
                                <Input placeholder="Camry" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vehicleYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input placeholder="2022" maxLength={4} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vehicleColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <Input placeholder="White" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="licensePlate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Plate</FormLabel>
                              <FormControl>
                                <Input placeholder="MH 01 AB 1234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Details */}
                <div className="lg:col-span-3">
                  <Card className="border-2 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-accent" />
                        Describe Your Issue
                      </CardTitle>
                      <CardDescription>
                        Provide any additional details that might help
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your situation... E.g., 'Front left tire is completely flat, pulled over on the highway shoulder'"
                                className="min-h-[120px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Submit Button */}
                <div className="lg:col-span-3">
                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="xl" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <AlertTriangle className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    By submitting, you agree to our terms of service. A mechanic will be dispatched immediately.
                  </p>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestAssistance;
