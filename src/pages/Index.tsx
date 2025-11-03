import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Wallet, GraduationCap, Briefcase, Home } from "lucide-react";
import heroSavings from "@/assets/hero-savings.jpg";
import heroLoans from "@/assets/hero-loans.jpg";
import heroEducation from "@/assets/hero-education.jpg";

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: heroSavings,
      title: "Save for Your Future",
      description: "Secure your tomorrow with our flexible savings plans",
      icon: Wallet,
    },
    {
      image: heroLoans,
      title: "Business & Asset Loans",
      description: "Grow your business with competitive loan rates",
      icon: Briefcase,
    },
    {
      image: heroEducation,
      title: "Education Loans",
      description: "Invest in education for a brighter future",
      icon: GraduationCap,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      title: "Business Loans",
      description: "Competitive rates to help your business thrive",
      icon: Briefcase,
      color: "bg-primary",
    },
    {
      title: "Asset Loans",
      description: "Finance your dream home or vehicle",
      icon: Home,
      color: "bg-secondary",
    },
    {
      title: "Education Loans",
      description: "Invest in knowledge and skills",
      icon: GraduationCap,
      color: "bg-tertiary",
    },
    {
      title: "Savings & Shares",
      description: "Build wealth through our savings programs",
      icon: Wallet,
      color: "bg-quaternary",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Slideshow */}
        <section className="relative h-[500px] overflow-hidden md:h-[600px]">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
              <div className="absolute inset-0 flex items-center">
                <div className="container px-4">
                  <div className="max-w-2xl animate-fade-in">
                    <slide.icon className="mb-4 h-12 w-12 text-primary" />
                    <h2 className="mb-4 text-4xl font-bold text-white md:text-6xl">
                      {slide.title}
                    </h2>
                    <p className="mb-6 text-lg text-white/90 md:text-xl">
                      {slide.description}
                    </p>
                    <Button size="lg" className="bg-gradient-primary">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-primary" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="mb-12 text-center">
              <h3 className="mb-4 text-3xl font-bold md:text-4xl">Our Services</h3>
              <p className="text-lg text-muted-foreground">
                Everything you need to achieve your financial goals
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden transition-all hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${service.color}`}
                    >
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="mb-2 text-xl font-semibold">{service.title}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-16">
          <div className="container px-4 text-center">
            <h3 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Start Your Journey?
            </h3>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of members who trust us with their financial future
            </p>
            <Button size="lg" className="bg-gradient-primary">
              Become a Member
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
