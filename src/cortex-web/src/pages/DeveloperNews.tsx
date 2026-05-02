// Developer News: curated feed of developer articles and updates

import { InlineLoading, Tile } from "@carbon/react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  readTime: string;
  imageUrl: string;
  saved: boolean;
}

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    title: "GitHub Copilot Enterprise is now generally available",
    source: "GitHub Changelog",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
    saved: false,
  },
  {
    id: "2",
    title: "10 React Hooks you should start using today",
    source: "Dev.to",
    readTime: "8 min read",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
    saved: false,
  },
];

export default function DeveloperNews() {
  const [articles, setArticles] = useState<NewsArticle[]>(MOCK_ARTICLES);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const filters = ["All", "GitHub", "Dev.to", "Hacker News"];

  const toggleSave = (id: string) => {
    setArticles(articles.map(a => a.id === id ? { ...a, saved: !a.saved } : a));
  };

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Top Header */}
      <header style={{
        background: "var(--cortex-surface-container-lowest)",
        padding: "1rem",
        paddingBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>list</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, flex: 1, paddingLeft: "0.5rem" }}>
          Developer News
        </h2>
      </header>

      {/* Filter Chips */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        overflowX: "auto",
        background: "var(--cortex-surface)",
        borderBottom: "1px solid var(--cortex-outline-variant)"
      }}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            style={{
              display: "flex",
              height: 32,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.25rem",
              background: selectedFilter === filter ? "var(--cortex-primary)" : "var(--cortex-surface-container)",
              border: selectedFilter === filter ? "none" : "1px solid var(--cortex-outline-variant)",
              padding: "0 0.5rem",
              cursor: "pointer",
              transition: "background-color 0.15s ease"
            }}
          >
            <p style={{
              margin: 0,
              color: selectedFilter === filter ? "var(--cortex-on-primary)" : "var(--cortex-on-surface-variant)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12
            }}>
              {filter}
            </p>
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <main style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 1024, margin: "0 auto", width: "100%" }}>
        {articles.map(article => (
          <article
            key={article.id}
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "0.25rem",
              background: "var(--cortex-surface-container-lowest)",
              border: "1px solid var(--cortex-outline-variant)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "21/9",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                borderBottom: "1px solid var(--cortex-outline-variant)",
                backgroundImage: `url('${article.imageUrl}')`
              }}
            />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "var(--cortex-on-background)",
                cursor: "pointer"
              }}
              className="article-title"
              >
                {article.title}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between", marginTop: "0.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{
                    background: "var(--cortex-surface-container)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 12,
                    color: "var(--cortex-on-surface-variant)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    {article.source}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--cortex-on-surface-variant)", fontSize: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSave(article.id)}
                  style={{
                    color: article.saved ? "var(--cortex-primary)" : "var(--cortex-on-surface-variant)",
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    width: 32,
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: article.saved ? "'FILL' 1" : "'FILL' 0" }}>
                    bookmark
                  </span>
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Load More */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", marginBottom: "2rem" }}>
          <button style={{
            padding: "0.5rem 1.5rem",
            border: "1px solid var(--cortex-outline)",
            background: "var(--cortex-surface-container-lowest)",
            color: "var(--cortex-primary)",
            fontSize: 14,
            borderRadius: "0.25rem",
            cursor: "pointer",
            transition: "background-color 0.15s ease"
          }}>
            Load More Articles
          </button>
        </div>
      </main>

      <style>{`
        .article-title:hover {
          color: var(--cortex-primary);
          transition: color 0.15s ease;
        }
      `}</style>
    </div>
  );
}
