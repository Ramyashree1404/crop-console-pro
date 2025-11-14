import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Calendar, ArrowRight } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
}

const Index = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublishedArticles();
  }, []);

  const fetchPublishedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Sprout className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AgriSmart News</h1>
                <p className="text-sm opacity-90">Latest in Agriculture & Farming</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate("/auth")}>
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading articles...</div>
          </div>
        ) : articles.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Sprout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Articles Yet</h2>
              <p className="text-muted-foreground mb-6">
                Check back soon for the latest agriculture news and updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                  <CardTitle className="text-xl leading-tight">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {article.excerpt || article.content.substring(0, 150) + "..."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="group">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-muted mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AgriSmart News. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
