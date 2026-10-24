import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col items-center justify-center p-6 text-center">
      <Heart className="w-8 h-8 text-heart mb-6 opacity-80" />
      <span className="eyebrow mb-2">404</span>
      <h1 className="font-serif text-5xl sm:text-6xl text-cream mb-4">
        Gallery Not Found
      </h1>
      <p className="text-cream-dim text-sm max-w-md font-light mb-8">
        This exhibition corridor does not exist or may have been unhung.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-pill bg-cream text-ink text-sm font-medium hover:bg-gold transition-colors inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to entrance</span>
      </Link>
    </div>
  );
};
