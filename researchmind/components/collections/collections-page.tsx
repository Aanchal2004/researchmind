"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createCollection,
  deleteCollection,
  loadCollections,
  subscribeCollections,
  type Collection,
} from "@/lib/collections";

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollections(loadCollections());
    return subscribeCollections(() => setCollections(loadCollections()));
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Library</div>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Collections
              <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-0.5 text-base font-medium text-teal-200">
                {collections.length}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Organize saved papers into topic-focused groups.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110">
                <Plus className="size-4" />
                New collection
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-[#07131d] text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-white">New collection</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Give your collection a name and optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                />
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
            <FolderKanban className="size-7" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">No collections yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Group saved papers by topic to build structured literature reviews.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onDelete={() => {
                deleteCollection(col.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ collection, onDelete }: { collection: Collection; onDelete: () => void }) {
  const updated = new Date(collection.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br ${collection.accent} flex items-center justify-center`}
        >
          <FolderKanban className="size-5 text-slate-950/70" />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/collections/${collection.id}`}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/6 hover:text-white"
          >
            <Pencil className="size-3.5" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/6 hover:text-rose-300"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div>
        <Link
          href={`/collections/${collection.id}`}
          className="text-base font-semibold text-white hover:text-teal-100"
        >
          {collection.name}
        </Link>
        {collection.description && (
          <p className="mt-1 text-sm text-slate-400 line-clamp-2">{collection.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{collection.paperIds.length} papers</span>
        <span>Updated {updated}</span>
      </div>
      {collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {collection.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-xs text-slate-400">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
