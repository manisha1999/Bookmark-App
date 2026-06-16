import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  createBookmark,
  deleteBookmark,
  getReadableBookmarks,
  getMyBookmarks,
  type Bookmark,
  updateBookmark,
} from '../api/bookmarks';
import { logoutAccount } from '../api/auth';

type HomeProps = {
  status: string;
  message: string;
};

const Home = ({ status, message }: HomeProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [readableBookmarks, setReadableBookmarks] = useState<Bookmark[]>([]);
  const [readableLoading, setReadableLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        setProfileError(error.message);
        return;
      }

      setUser(data.user);

      if (data.user) {
        setBookmarksLoading(true);
        const result = await getMyBookmarks(data.user.id);
        setBookmarksLoading(false);

        if (result.error) {
          setBookmarkError(result.error);
          return;
        }

        setBookmarks(result.data);
      }

      setReadableLoading(true);
      const readableResult = await getReadableBookmarks();
      setReadableLoading(false);

      if (readableResult.error) {
        setBookmarkError(readableResult.error);
        return;
      }

      setReadableBookmarks(readableResult.data);
    };

    void loadProfile();
  }, []);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setIsPublic(false);
    setEditingId(null);
  };

  const isValidUrl = (candidate: string) => {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSaveBookmark = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookmarkError('');

    if (!user) {
      setBookmarkError('Please log in to manage bookmarks.');
      return;
    }

    if (!title.trim() || !url.trim()) {
      setBookmarkError('Title and URL are required.');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setBookmarkError('Please provide a valid URL starting with http:// or https://');
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateBookmark(editingId, user.id, {
        title: title.trim(),
        url: url.trim(),
        isPublic,
      });
      setSaving(false);

      if (result.error) {
        setBookmarkError(result.error);
        return;
      }

      if (result.data) {
        const updatedBookmark = result.data;
        setBookmarks((current) =>
          current.map((bookmark) =>
            bookmark.id === editingId ? updatedBookmark : bookmark
          )
        );
        setReadableBookmarks((current) =>
          current.map((bookmark) =>
            bookmark.id === editingId ? updatedBookmark : bookmark
          )
        );
      }

      resetForm();
      return;
    }

    const result = await createBookmark({
      title: title.trim(),
      url: url.trim(),
      isPublic,
    });
    setSaving(false);

    if (result.error) {
      setBookmarkError(result.error);
      return;
    }

    if (result.data) {
      const createdBookmark = result.data;
      setBookmarks((current) => [createdBookmark, ...current]);
      setReadableBookmarks((current) => [createdBookmark, ...current]);
    }

    resetForm();
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setIsPublic(bookmark.is_public);
    setEditingId(bookmark.id);
    setBookmarkError('');
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) {
      setBookmarkError('Please log in to manage bookmarks.');
      return;
    }

    setBookmarkError('');
    const result = await deleteBookmark(bookmarkId, user.id);

    if (result.error) {
      setBookmarkError(result.error);
      return;
    }

    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== bookmarkId));
    setReadableBookmarks((current) =>
      current.filter((bookmark) => bookmark.id !== bookmarkId)
    );

    if (editingId === bookmarkId) {
      resetForm();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await logoutAccount();
    setLoggingOut(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    navigate('/login', { replace: true });
  };

  const avatarLetter = user?.email?.charAt(0).toUpperCase() || 'P';

  return (
    <div className="home-screen" aria-live="polite">
      <header className="home-navbar">
        <div className="home-brand">EagerMind</div>

        <nav className="home-links" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/signup">Signup</Link>
          <Link to="/login">Login</Link>
        </nav>

        <div className="profile-wrap">
          <button
            type="button"
            className="profile-icon"
            aria-label="Open profile details"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            {avatarLetter}
          </button>

          {profileOpen ? (
            <section className="profile-panel">
              <h3>Profile Details</h3>

              {profileError ? (
                <p className="error-text">{profileError}</p>
              ) : (
                <>
                  <p>
                    <strong>Email:</strong> {user?.email || 'No active user'}
                  </p>
                  <p>
                    <strong>User ID:</strong> {user?.id || 'Not available'}
                  </p>
                  <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                  
                </>
              )}
            </section>
          ) : null}
        </div>
      </header>

      <main className="home-hero">
        <h1>Welcome to your Home Page</h1>
        <p>Use the profile icon in the navbar to view account details.</p>

        <div className="home-status">
          <span className={`badge ${status.toLowerCase()}`}>{status}</span>
          <p>{message}</p>
        </div>

        <section className="bookmarks-shell">
          <h2>Your Bookmarks</h2>

          {!user ? (
            <p className="bookmarks-empty">
              Please sign in first. Only signed-in users can add, edit, and delete
              their own bookmarks.
            </p>
          ) : (
            <>
              <form className="bookmark-form" onSubmit={handleSaveBookmark}>
                <div className="bookmark-grid">
                  <div>
                    <label htmlFor="bookmark-title">Title</label>
                    <input
                      id="bookmark-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="My portfolio"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="bookmark-url">URL</label>
                    <input
                      id="bookmark-url"
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>

                <label className="checkbox-row" htmlFor="bookmark-public">
                  <input
                    id="bookmark-public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                  />
                  Public bookmark
                </label>

                <div className="bookmark-actions">
                  <button type="submit" disabled={saving}>
                    {saving
                      ? editingId
                        ? 'Updating...'
                        : 'Adding...'
                      : editingId
                      ? 'Update bookmark'
                      : 'Add bookmark'}
                  </button>

                  {editingId ? (
                    <button type="button" className="ghost-btn" onClick={resetForm}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              {bookmarksLoading ? (
                <p className="bookmarks-empty">Loading your bookmarks...</p>
              ) : bookmarks.length === 0 ? (
                <p className="bookmarks-empty">No bookmarks yet. Add your first one.</p>
              ) : (
                <ul className="bookmarks-list">
                  {bookmarks.map((bookmark) => (
                    <li key={bookmark.id} className="bookmark-item">
                      <div className="bookmark-main">
                        <h3>{bookmark.title}</h3>
                        <a href={bookmark.url} target="_blank" rel="noreferrer">
                          {bookmark.url}
                        </a>
                      </div>

                      <div className="bookmark-side">
                        <span
                          className={`visibility-chip ${
                            bookmark.is_public ? 'public' : 'private'
                          }`}
                        >
                          {bookmark.is_public ? 'Public' : 'Private'}
                        </span>

                        <div className="item-actions">
                          <button type="button" onClick={() => handleEditBookmark(bookmark)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {bookmarkError ? <p className="error-text">{bookmarkError}</p> : null}
        </section>

        <section className="bookmarks-shell read-only-shell">
          <h2>All Readable Bookmarks</h2>
          <p className="bookmarks-empty">
            Everyone can read public bookmarks. Private bookmarks are only visible
            to their owner.
          </p>

          {readableLoading ? (
            <p className="bookmarks-empty">Loading readable bookmarks...</p>
          ) : readableBookmarks.length === 0 ? (
            <p className="bookmarks-empty">No readable bookmarks found.</p>
          ) : (
            <ul className="bookmarks-list">
              {readableBookmarks.map((bookmark) => (
                <li key={`readable-${bookmark.id}`} className="bookmark-item">
                  <div className="bookmark-main">
                    <h3>{bookmark.title}</h3>
                    <a href={bookmark.url} target="_blank" rel="noreferrer">
                      {bookmark.url}
                    </a>
                  </div>

                  <div className="bookmark-side">
                    <span
                      className={`visibility-chip ${
                        bookmark.is_public ? 'public' : 'private'
                      }`}
                    >
                      {bookmark.is_public ? 'Public' : 'Private'}
                    </span>
                    <span className="read-only-note">Read only</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;