import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import keralaImage from "@/assets/kerala-backwaters.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<"flexible" | "calendar">("flexible");
  const [searchLocation, setSearchLocation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (dateRange?.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    const query = params.toString();
    navigate(`/rentals${query ? `?${query}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={keralaImage}
          alt="Vacation destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Tagline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 animate-slide-up">
            Name Your Price. Book Your Paradise.
          </h1>
          <p className="text-base md:text-lg text-white/90 font-medium mb-8 max-w-xl mx-auto animate-fade-in">
            Luxury vacation rentals from verified timeshare owners — save 20-40% vs resort-direct.
          </p>

          {/* Search Box */}
          <div className="bg-card backdrop-blur-lg rounded-2xl shadow-card-hover p-4 md:p-6 max-w-3xl mx-auto animate-scale-in border border-border/50">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchTab("flexible")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchTab === "flexible"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                I'm Flexible
              </button>
              <button
                onClick={() => setSearchTab("calendar")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchTab === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <CalendarIcon className="w-4 h-4 inline-block mr-1" />
                Calendar
              </button>
            </div>

            {/* Search Fields */}
            {searchTab === "flexible" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Where do you want to go?"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Where do you want to go?"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                          !dateRange?.from ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {dateRange?.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          "Check-in — Check-out"
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Placeholder for future category bar — issue #328 (Attraction Filtering) */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
