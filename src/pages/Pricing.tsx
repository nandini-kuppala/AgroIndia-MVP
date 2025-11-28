import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, TrendingUp, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Small Farmer",
      subtitle: "Perfect for small landholdings",
      price: "₹2,999",
      period: "per season",
      description: "Ideal for farmers with 5-15 acres in AP & Telangana",
      features: [
        "Up to 15 acres coverage",
        "Basic NDVI analysis (2 scans/season)",
        "Crop recommendation for Rice, Cotton, Maize",
        "SMS weather alerts",
        "Government scheme notifications",
        "Regional market prices (Guntur, Warangal)",
        "Basic soil health report"
      ],
      recommended: false,
      badge: null
    },
    {
      name: "Progressive Farmer",
      subtitle: "Most popular for medium farms",
      price: "₹7,999",
      period: "per season",
      description: "Best for 15-50 acres with advanced monitoring",
      features: [
        "Up to 50 acres coverage",
        "Advanced NDVI analysis (4 scans/season)",
        "Multi-crop recommendations (10+ crops)",
        "Real-time weather & rainfall tracking",
        "Irrigation scheduling assistance",
        "Regional mandi prices (all major AP & TG markets)",
        "Detailed soil analysis with NPK levels",
        "Water requirement estimation",
        "Pest & disease early warning",
        "1 free agronomist consultation/month"
      ],
      recommended: true,
      badge: "Most Popular"
    },
    {
      name: "Commercial Farmer",
      subtitle: "For large-scale operations",
      price: "₹18,999",
      period: "per season",
      description: "Large farms, contract farming, and commercial ventures",
      features: [
        "Unlimited acres coverage",
        "Premium NDVI analysis (8+ scans/season)",
        "AI-powered yield prediction",
        "Custom crop rotation planning",
        "Advanced irrigation optimization",
        "Real-time commodity trading alerts",
        "Complete soil & water testing",
        "Drone mapping integration (discounted)",
        "Pest management AI assistant",
        "Priority agronomist support (unlimited calls)",
        "Export documentation assistance",
        "Contract farming opportunity connections"
      ],
      recommended: false,
      badge: "Premium"
    }
  ];

  const regionalBenefits = [
    "Optimized for Kharif & Rabi seasons in AP & Telangana",
    "Integration with local mandis (Guntur, Warangal, Karimnagar, Nizamabad)",
    "Weather data from IMD stations across both states",
    "Soil compatibility with red, black & alluvial soils",
    "Government subsidy scheme integration (Rythu Bandhu, PM-KISAN)",
    "Regional language support (Telugu, Urdu)"
  ];

  return (
    <div className="min-h-screen bg-gradient-earth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose the Right Plan for Your Farm
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tailored solutions for farmers in Andhra Pradesh and Telangana.
            All plans include regional market integration and local expert support.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative shadow-medium hover:shadow-strong transition-all ${
                plan.recommended 
                  ? 'border-primary border-2 scale-105 md:scale-110' 
                  : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm mb-4">
                  {plan.subtitle}
                </CardDescription>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  size="lg"
                >
                  {plan.recommended ? "Get Started" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Regional Benefits */}
        <Card className="shadow-medium mb-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Regional Advantages</span>
            </CardTitle>
            <CardDescription>
              All plans include these benefits specific to Andhra Pradesh & Telangana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionalBenefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Money Back Guarantee */}
        <Card className="shadow-medium bg-primary-light border-primary">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Shield className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    100% Satisfaction Guarantee
                  </h3>
                  <p className="text-muted-foreground">
                    Not satisfied? Get a full refund within 30 days of purchase
                  </p>
                </div>
              </div>
              <Button variant="default" size="lg" asChild>
                <NavLink to="/dashboard">
                  Go to Dashboard
                </NavLink>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need help choosing? Our experts are here to guide you.
          </p>
          <Button variant="outline" size="lg" asChild>
            <NavLink to="/consultation">
              Book Free Consultation
            </NavLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
