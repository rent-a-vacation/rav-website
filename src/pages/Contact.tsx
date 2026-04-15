import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Contact = () => {
  usePageMeta({
    title: 'Contact Us',
    description: 'Get in touch with the Rent-A-Vacation team for support, questions, or partnership inquiries.',
    canonicalPath: '/contact',
  });
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          user_id: user?.id || null,
        },
      });

      if (error) throw error;

      setStatus("sent");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send message. Please try email instead."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 md:pt-32 pb-12 md:pb-16 bg-gradient-warm border-b border-border/60">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Send us a message
            and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl p-6 sm:p-8 shadow-card border border-border/60">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-6">
                  Send Us a Message
                </h2>

                {status === "sent" ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button variant="outline" onClick={() => setStatus("idle")}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                        required
                      >
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="booking">Booking Help</SelectItem>
                          <SelectItem value="account">Account Issue</SelectItem>
                          <SelectItem value="listing">Listing Support</SelectItem>
                          <SelectItem value="payment">Payment Question</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    {status === "error" && (
                      <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive">
                          {errorMessage || "Something went wrong. Please try emailing us directly."}
                        </p>
                      </div>
                    )}

                    <Button type="submit" size="lg" disabled={status === "sending"}>
                      <Send className="w-4 h-4 mr-2" />
                      {status === "sending" ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-4">
                  Get in Touch
                </h3>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="mailto:support@rent-a-vacation.com"
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          support@rent-a-vacation.com
                        </p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="tel:+18007280800" className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Phone</p>
                        <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          1-800-RAV-0800
                        </p>
                      </div>
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p className="text-sm text-muted-foreground">
                        Jacksonville, FL, United States
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">
                    Quick Answers
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Many questions are already answered in our FAQ and guides.
                </p>
                <div className="space-y-2">
                  <Link to="/faq">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      View FAQs
                    </Button>
                  </Link>
                  <Link to="/user-guide">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      User Guide
                    </Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      How It Works
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
