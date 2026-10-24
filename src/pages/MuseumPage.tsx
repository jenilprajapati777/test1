import React from "react";
import { useParams, Link } from "react-router-dom";

export const MuseumPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen bg-bg0 text-cream p-8">
      <h1 className="font-serif text-3xl mb-4">Museum: {slug}</h1>
      <Link to="/" className="text-gold underline">
        Home
      </Link>
    </div>
  );
};
