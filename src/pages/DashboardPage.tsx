import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Plus,
  Eye,
  Share2,
  Trash2,
  MessageSquare,
  UserCheck,
  Calendar,
  AlertTriangle,
  Archive,
} from "lucide-react";
import { getClient } from "../client";
import { Museum, Reply } from "../types/museum";

export const DashboardPage: React.FC = () => {
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Museum | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    const client = getClient();
    const list = await client.listMyMuseums();
    setMuseums(list);

    // Fetch replies for each museum
    const repliesMap: Record<string, Reply[]> = {};
    for (const m of list) {
      const museumId = m.id || m.slug;
      try {
        const reps = await client.getReplies(museumId);
        repliesMap[museumId] = reps;
      } catch {
        repliesMap[museumId] = [];
      }
    }
    setReplies(repliesMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (museum: Museum) => {
    const museumId = museum.id || museum.slug;
    const nextStatus = museum.status === "published" ? "draft" : "published";
    const client = getClient();
    await client.setStatus(museumId, nextStatus);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget || confirmInput.trim().toLowerCase() !== "delete") return;
    const targetId = deleteTarget.id || deleteTarget.slug;
    setIsDeleting(true);
    try {
      const client = getClient();
      await client.deleteMuseum(targetId);
      setDeleteTarget(null);
      setConfirmInput("");
      loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col font-sans selection:bg-gold/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-bg1/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link
          to="/"
          className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
        >
          <Heart className="w-5 h-5 text-heart fill-heart" />
          <span className="font-serif italic text-lg tracking-tight">
            Museum of Us
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/create"
            className="px-4 py-2 rounded-full bg-gold text-ink font-semibold text-xs flex items-center gap-1.5 hover:bg-gold/90 transition-all shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Museum</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-1 block">
              Curator Studio
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-cream tracking-tight">
              Your Collections
            </h1>
          </div>
          <p className="text-xs text-cream-dim font-mono">
            {museums.length} {museums.length === 1 ? "Museum" : "Museums"}{" "}
            Created
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Heart className="w-8 h-8 text-heart fill-heart animate-pulse mb-3" />
            <p className="text-xs font-mono text-cream-dim">
              Loading your museums...
            </p>
          </div>
        ) : museums.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <Heart className="w-10 h-10 text-cream-dim/30 mb-3" />
            <h3 className="font-serif text-xl text-cream mb-1">
              No museums created yet
            </h3>
            <p className="text-xs text-cream-dim max-w-sm mb-6">
              Create your first interactive 3D gift museum and share a scannable
              heart QR with someone you love.
            </p>
            <Link
              to="/create"
              className="px-6 py-2.5 rounded-full bg-gold text-ink font-semibold text-xs hover:bg-gold/90 transition-all shadow-glow"
            >
              Create Your Museum
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {museums.map((m) => {
              const museumId = m.id || m.slug;
              const museumReplies = replies[museumId] || [];
              const isPublished = m.status === "published";

              return (
                <div
                  key={museumId}
                  className="rounded-2xl bg-bg1 border border-white/10 p-6 shadow-xl flex flex-col gap-6"
                >
                  {/* Museum Header & Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-2xl text-cream tracking-tight">
                          {m.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPublished
                              ? "bg-presence/20 text-presence border border-presence/30"
                              : "bg-white/10 text-cream-dim"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-cream-dim font-serif italic">
                        From <span className="text-cream">{m.from_name}</span> │
                        To <span className="text-cream">{m.to_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-cream-dim">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>{m.view_count || 0} visits</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cream-dim" />
                        <span>
                          {m.created_at
                            ? new Date(m.created_at).toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/m/${m.slug}`}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold" />
                      <span>Visit Museum</span>
                    </Link>

                    <Link
                      to={`/m/${m.slug}?as=host`}
                      className="px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-xs text-gold font-medium flex items-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Enter as Host</span>
                    </Link>

                    <Link
                      to={`/share/${m.id}`}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5 text-heart" />
                      <span>Share Card & QR</span>
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(m)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream-dim hover:text-cream font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{isPublished ? "Unpublish" : "Publish"}</span>
                    </button>

                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="px-3 py-2 rounded-xl bg-heart/10 hover:bg-heart/20 border border-heart/20 text-xs text-heart font-medium flex items-center gap-1.5 transition-all ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Replies / Guestbook Inbox */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-gold font-mono mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Guestbook Notes ({museumReplies.length})</span>
                    </h4>

                    {museumReplies.length === 0 ? (
                      <p className="text-xs text-cream-dim/60 italic font-serif">
                        No replies left by visitors yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {museumReplies.map((rep: Reply) => (
                          <div
                            key={rep.id || rep.created_at}
                            className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-cream-dim font-mono">
                              <span className="font-semibold text-cream">
                                {rep.visitor_name}
                              </span>
                              <span>
                                {rep.created_at
                                  ? new Date(rep.created_at).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                            <p className="text-cream leading-relaxed font-serif italic">
                              "{rep.message}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg1 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-heart mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-serif text-xl text-cream">
                  Confirm Deletion
                </h3>
              </div>
              <p className="text-xs text-cream-dim mb-4 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-cream font-medium">
                  "{deleteTarget.title}"
                </span>
                ? All photos, plaque dedications, and guestbook replies will be
                permanently removed.
              </p>
              <p className="text-xs text-cream-dim mb-2 font-mono">
                Type <span className="text-heart font-bold">delete</span> to
                confirm:
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="delete"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-cream text-xs mb-5 focus:outline-none focus:border-heart font-mono"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmInput("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-cream hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    confirmInput.trim().toLowerCase() !== "delete" || isDeleting
                  }
                  className="px-5 py-2 rounded-xl bg-heart text-white text-xs font-semibold hover:bg-heart/90 transition-all disabled:opacity-40"
                >
                  {isDeleting ? "Deleting..." : "Delete Museum"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
