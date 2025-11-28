import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Satellite, TrendingUp, Map, BarChart3, Shield, Star, CheckCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import heroFarmland from "@/assets/hero-farmland.jpg";
import satelliteAnalysis from "@/assets/satellite-analysis.jpg";
import cropShowcase from "@/assets/crop-showcase.jpg";

const Landing = () => {
  const features = [
    {
      icon: Satellite,
      title: "Satellite Analysis",
      description: "Advanced NDVI analysis and vegetation mapping for precise field monitoring"
    },
    {
      icon: TrendingUp,
      title: "Profit Optimization",
      description: "AI-powered crop recommendations to maximize your agricultural returns"
    },
    {
      icon: Map,
      title: "Field Mapping",
      description: "Interactive mapping tools to outline and analyze your land parcels"
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "Comprehensive reports and insights for data-driven farming decisions"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "₹999",
      period: "/month",
      features: [
        "Up to 5 fields",
        "Basic satellite analysis",
        "Crop recommendations",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: "₹2,999",
      period: "/month",
      features: [
        "Up to 25 fields",
        "Advanced NDVI analysis",
        "Historical data (5 years)",
        "Priority support",
        "Expert consultations"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹9,999",
      period: "/month",
      features: [
        "Unlimited fields",
        "Real-time monitoring",
        "Custom analysis",
        "On-site visits",
        "Dedicated support"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      location: "Andhra Pradesh",
      rating: 5,
      comment: "AgroIndia helped me increase my crop yield by 35% with their precise land analysis."
    },
    {
      name: "Priya Sharma",
      location: "Telangana",
      rating: 5,
      comment: "The satellite imagery and crop recommendations are incredibly accurate. Highly recommended!"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroFarmland})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/70" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Optimize Your Agricultural Land with{" "}
              <span className="text-primary">AI-Powered</span> Analysis
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform your farming decisions with satellite imagery, NDVI analysis, and smart crop recommendations. 
              Maximize profits while optimizing land use across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" asChild>
                <NavLink to="/dashboard">
                  <Leaf className="mr-2 h-5 w-5" />
                  Start Free Analysis
                </NavLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <NavLink to="/services">
                  Learn More
                </NavLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Advanced Agricultural Technology
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leverage cutting-edge satellite technology and AI to make informed decisions about your agricultural land
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center shadow-medium hover:shadow-strong transition-shadow">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Showcase */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Satellite-Powered Field Analysis
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our advanced NDVI (Normalized Difference Vegetation Index) analysis provides detailed insights 
                into your field's vegetation health, helping you identify the most profitable areas of your land.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-ndvi-high rounded-full"></div>
                  <span className="text-foreground font-medium">Highly Profitable Areas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-ndvi-moderate rounded-full"></div>
                  <span className="text-foreground font-medium">Moderately Profitable Areas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-ndvi-average rounded-full"></div>
                  <span className="text-foreground font-medium">Average Productivity</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-ndvi-low rounded-full"></div>
                  <span className="text-foreground font-medium">Low Productivity</span>
                </div>
              </div>

              <Button variant="default" size="lg" asChild>
                <NavLink to="/analysis">
                  View Sample Analysis
                </NavLink>
              </Button>
            </div>
            
            <div className="relative">
              <img
                src={satelliteAnalysis}
                alt="Satellite Analysis Dashboard"
                className="rounded-lg shadow-strong"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Crop Recommendations */}
      <section className="py-20 bg-gradient-earth">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={cropShowcase}
                alt="Agricultural Crops"
                className="rounded-lg shadow-strong"
              />
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Smart Crop Recommendations
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get AI-powered crop recommendations based on your land analysis, soil conditions, 
                climate data, and current market prices. Optimize your crop selection for maximum profitability.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {["Rice", "Cotton", "Sugarcane", "Maize", "Groundnut", "Chilli", "Turmeric", "Pulses"].map((crop) => (
                  <div key={crop} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-foreground">{crop}</span>
                  </div>
                ))}
              </div>

              <Button variant="success" size="lg" asChild>
                <NavLink to="/dashboard">
                  Get Crop Recommendations
                </NavLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground">
              Flexible pricing for farmers of all sizes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative shadow-medium hover:shadow-strong transition-shadow ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className="w-full" 
                    size="lg"
                    asChild
                  >
                    <NavLink to="/dashboard">
                      Get Started
                    </NavLink>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by Farmers Across India
            </h2>
            <p className="text-xl text-muted-foreground">
              See how AgroIndia is transforming agricultural practices
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-medium">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-warning fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Agriculture?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of farmers who are already using AgroIndia to optimize their land and increase profits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <NavLink to="/dashboard">
                <Leaf className="mr-2 h-5 w-5" />
                Start Free Trial
              </NavLink>
            </Button>
            <Button variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <NavLink to="/services">
                Book Consultation
              </NavLink>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;