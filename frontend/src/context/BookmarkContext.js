import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { listBookmarks, addBookmark, deleteBookmark } from "../services/api";
import { useAuth } from "./AuthContext";

const BookmarkContext = createContext(null);

export function BookmarkProvider({ children }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listBookmarks();
      setBookmarks(res.data || []);
    } catch (err) {
      console.warn("Could not fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const isBookmarked = (itemName) => {
    if (!itemName || !bookmarks || !bookmarks.length) return false;
    return bookmarks.some((b) => b?.item_name?.toLowerCase() === itemName?.toLowerCase());
  };

  const toggleBookmark = async (itemType, item) => {
    if (!user) {
      alert("Please sign in to save places to your TripPilot Wishlist!");
      return false;
    }

    if (!item || !item.name) return false;

    const existing = bookmarks.find(
      (b) => b?.item_name?.toLowerCase() === item.name?.toLowerCase()
    );

    if (existing) {
      try {
        await deleteBookmark(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
        return false;
      } catch (e) {
        console.error("Error removing bookmark:", e);
      }
    } else {
      try {
        const res = await addBookmark({
          item_type: itemType,
          item_name: item.name,
          destination: item.destination || "",
          details: item,
        });
        setBookmarks((prev) => [
          {
            id: res.data.id,
            item_type: itemType,
            item_name: item.name,
            destination: item.destination || "",
            details: item,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        return true;
      } catch (e) {
        console.error("Error saving bookmark:", e);
      }
    }
    return false;
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        loading,
        isBookmarked,
        toggleBookmark,
        fetchBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarkProvider");
  return ctx;
}
