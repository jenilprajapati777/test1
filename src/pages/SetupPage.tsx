import React from "react";
import { Link } from "react-router-dom";

export const SetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg0 text-cream p-8">
      <h1 className="font-serif text-3xl mb-4">Setup Diagnostics</h1>
      <Link to="/" className="text-gold underline">
        Home
      </Link>
    </div>
  );
};
