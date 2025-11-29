import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, MapPin, Users, CheckCircle, Clock, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Consultation {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  consultation_type: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  created_at: string;
}

const Consultation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    state: "",
    district: "",
    farmSize: "",
    consultationType: "",
    preferredDate: "",
    preferredTime: "",
    cropType: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (user) {
      fetchConsultations();
    }
  }, [user]);

  const fetchConsultations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("user_id", user.id)
        .order("preferred_date", { ascending: true });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a consultation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("consultations")
        .insert([{
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          district: formData.district,
          consultation_type: formData.consultationType,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          message: formData.message,
        }]);

      if (error) throw error;

      toast({
        title: "Consultation Booked Successfully! ✅",
        description: "Our expert will contact you within 24 hours to confirm your appointment.",
      });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        state: "",
        district: "",
        farmSize: "",
        consultationType: "",
        preferredDate: "",
        preferredTime: "",
        cropType: "",
        message: ""
      });

      // Refresh consultations list
      fetchConsultations();
    } catch (error) {
      console.error("Error booking consultation:", error);
      toast({
        title: "Error",
        description: "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingConsultations = consultations.filter(c => c.preferred_date >= today);
  const completedConsultations = consultations.filter(c => c.preferred_date < today);

  const experts = [
    {
      name: "Dr. Rama Krishna",
      expertise: "Soil Science & Crop Management",
      location: "Guntur, AP",
      languages: "Telugu, English, Hindi",
      experience: "15+ years"
    },
    {
      name: "Srinivas Reddy",
      expertise: "Irrigation & Water Management",
      location: "Warangal, TG",
      languages: "Telugu, English",
      experience: "12+ years"
    },
    {
      name: "Dr. Lakshmi Prasanna",
      expertise: "Organic Farming & Pest Control",
      location: "Karimnagar, TG",
      languages: "Telugu, English",
      experience: "10+ years"
    }
  ];

  const districts = {
    "Andhra Pradesh": [
      "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna",
      "Kurnool", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram",
      "West Godavari", "YSR Kadapa"
    ],
    "Telangana": [
      "Adilabad", "Hyderabad", "Jagtial", "Jangaon", "Karimnagar",
      "Khammam", "Mahabubabad", "Medak", "Nalgonda", "Nizamabad",
      "Ranga Reddy", "Sangareddy", "Warangal"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Expert Consultation
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Book Your Free Agricultural Consultation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with local agricultural experts in Andhra Pradesh and Telangana.
            Get personalized advice for your farm's success.
          </p>
        </div>

        {/* Consultation Types */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-medium hover:shadow-strong transition-shadow">
            <CardHeader>
              <Phone className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Phone Consultation</CardTitle>
              <CardDescription>
                30-minute call with our experts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Immediate advice
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Quick problem solving
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Available in Telugu
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-medium hover:shadow-strong transition-shadow border-primary border-2">
            <CardHeader>
              <Video className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Video Consultation</CardTitle>
              <CardDescription>
                60-minute detailed session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Visual field assessment
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Detailed recommendations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Screen sharing for data
                </li>
              </ul>
              <Badge className="mt-4" variant="default">Recommended</Badge>
            </CardContent>
          </Card>

          <Card className="shadow-medium hover:shadow-strong transition-shadow">
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>On-Site Visit</CardTitle>
              <CardDescription>
                Physical field inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Soil testing on-site
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Complete farm audit
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Practical demonstrations
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl">Book Your Session</CardTitle>
                <CardDescription>
                  Fill in your details and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                          <SelectItem value="Telangana">Telangana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">District *</Label>
                      <Select value={formData.district} onValueChange={(value) => handleInputChange("district", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your district" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.state && districts[formData.state as keyof typeof districts]?.map(district => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                          {!formData.state && (
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              Please select a state first
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="farmSize">Farm Size *</Label>
                      <Select value={formData.farmSize} onValueChange={(value) => handleInputChange("farmSize", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select farm size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-5">0-5 acres</SelectItem>
                          <SelectItem value="5-15">5-15 acres</SelectItem>
                          <SelectItem value="15-50">15-50 acres</SelectItem>
                          <SelectItem value="50+">50+ acres</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationType">Consultation Type *</Label>
                    <Select value={formData.consultationType} onValueChange={(value) => handleInputChange("consultationType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose consultation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone Call (30 min)</SelectItem>
                        <SelectItem value="video">Video Call (60 min)</SelectItem>
                        <SelectItem value="onsite">On-Site Visit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Date *</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Preferred Time *</Label>
                      <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange("preferredTime", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                          <SelectItem value="evening">Evening (4 PM - 7 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cropType">Main Crop Type</Label>
                    <Select value={formData.cropType} onValueChange={(value) => handleInputChange("cropType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rice">Rice (Paddy)</SelectItem>
                        <SelectItem value="cotton">Cotton</SelectItem>
                        <SelectItem value="maize">Maize</SelectItem>
                        <SelectItem value="turmeric">Turmeric</SelectItem>
                        <SelectItem value="chilli">Red Chilli</SelectItem>
                        <SelectItem value="groundnut">Groundnut</SelectItem>
                        <SelectItem value="sugarcane">Sugarcane</SelectItem>
                        <SelectItem value="mango">Mango</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">What would you like to discuss? *</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your questions or concerns about your farm..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    <Calendar className="mr-2 h-5 w-5" />
                    {loading ? "Booking..." : "Book Free Consultation"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to receive communication from our agricultural experts
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Experts & Info Sidebar */}
          <div className="space-y-6">
            {/* Our Experts */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Our Experts</span>
                </CardTitle>
                <CardDescription>
                  Local specialists from AP & TG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experts.map((expert, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-1">{expert.name}</h4>
                      <p className="text-xs text-primary mb-1">{expert.expertise}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {expert.location}
                        </p>
                        <p>{expert.languages}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {expert.experience}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>What to Expect</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span>Confirmation call within 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span>Regional expert matched to your location</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span>Written recommendations after session</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span>Follow-up support via WhatsApp</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span>Connection to local resources & subsidies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-medium bg-primary-light">
              <CardContent className="py-6">
                <h4 className="font-semibold text-foreground mb-4">Need Immediate Help?</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>+91 9876543210</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>support@agroindia.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Available Mon-Sat, 8 AM - 7 PM IST
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Consultations List */}
        {user && (
          <div className="mt-12 space-y-8">
            {/* Upcoming Consultations */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Consultations</h2>
              {loading ? (
                <Card className="shadow-medium">
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">Loading consultations...</p>
                  </CardContent>
                </Card>
              ) : upcomingConsultations.length === 0 ? (
                <Card className="shadow-medium">
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">No upcoming consultations</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingConsultations.map((consultation) => (
                    <Card key={consultation.id} className="shadow-medium hover:shadow-strong transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{consultation.name}</CardTitle>
                        <CardDescription>{consultation.consultation_type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <span>{new Date(consultation.preferred_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <span>{consultation.preferred_time}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span>{consultation.district}, {consultation.state}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-primary" />
                          <span>{consultation.phone}</span>
                        </div>
                        {consultation.message && (
                          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                            {consultation.message}
                          </p>
                        )}
                        <Badge variant="default" className="mt-3">Upcoming</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Consultations */}
            {completedConsultations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Completed Consultations</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedConsultations.map((consultation) => (
                    <Card key={consultation.id} className="shadow-medium opacity-75">
                      <CardHeader>
                        <CardTitle className="text-lg">{consultation.name}</CardTitle>
                        <CardDescription>{consultation.consultation_type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{new Date(consultation.preferred_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{consultation.preferred_time}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{consultation.district}, {consultation.state}</span>
                        </div>
                        {consultation.message && (
                          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                            {consultation.message}
                          </p>
                        )}
                        <Badge variant="secondary" className="mt-3">Completed</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultation;
