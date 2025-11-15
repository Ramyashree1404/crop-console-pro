import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Cloud, Droplets, Wind, Eye, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  image_url: string | null;
  created_at: string;
}

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [newsCount, setNewsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCounts();
    fetchArticles();
    fetchWeather();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const fetchWeather = async () => {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            const { data, error } = await supabase.functions.invoke("get-weather", {
              body: { lat: latitude, lon: longitude },
            });

            if (error) throw error;
            setWeather(data);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Default to a location if geolocation fails (e.g., New Delhi)
            fetchDefaultWeather();
          }
        );
      } else {
        fetchDefaultWeather();
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchDefaultWeather = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-weather", {
        body: { lat: 28.6139, lon: 77.209 }, // New Delhi coordinates
      });

      if (error) throw error;
      setWeather(data);
    } catch (error) {
      console.error("Error fetching default weather:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const [newsResponse, usersResponse] = await Promise.all([
        supabase.from("news_articles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
      ]);

      if (newsResponse.error) throw newsResponse.error;
      if (usersResponse.error) throw usersResponse.error;

      setNewsCount(newsResponse.count || 0);
      setUsersCount(usersResponse.count || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch counts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayedArticles = showAllArticles ? articles : articles.slice(0, 3);
  const hasMoreArticles = articles.length > 3;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : usersCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : newsCount}
            </div>
          </CardContent>
        </Card>

        {/* Weather Card */}
        {weather && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{weather.name}</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {Math.round(weather.main.temp)}°C
                </div>
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    {weather.main.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="h-3 w-3" />
                    {weather.wind.speed} m/s
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 capitalize">
                {weather.weather[0].description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* News Articles Section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Latest News Articles</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading articles...</div>
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No articles published yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedArticles.map((article) => (
              <Card 
                key={article.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                {article.image_url && (
                  <div className="h-48 overflow-hidden bg-muted">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(article.created_at)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMoreArticles && !showAllArticles && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setShowAllArticles(true)}>
                View More Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
