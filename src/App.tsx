import React, { useEffect, useState } from 'react';
import './App.css';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import {
  createBookmark,
  deleteBookmark,
  getMyBookmarks,
  getPublicBookmarks,
  type Bookmark,
  updateBookmark,
} from './api/bookmarks';
import { loginAccount, logoutAccount, signUpAccount } from './api/auth';

type ConnectionState = 'checking' | 'connected' | 'error';
type AuthMode = 'login' | 'signup';

function App() {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [message, setMessage] = useState('Checking Supabase connection...');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [myBookmarks, setMyBookmarks] = useState<Bookmark[]>([]);
  const [publicBookmarks, setPublicBookmarks] = useState<Bookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setMessage(error.message);
          return;
        }

        setUser(data.session?.user ?? null);
        setStatus('connected');
        setMessage('Supabase is connected and ready.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    void initializeSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadBookmarks = async () => {
      setPublicLoading(true);
      const publicResult = await getPublicBookmarks();
      setPublicLoading(false);

      if (publicResult.error) {
        setBookmarkError(publicResult.error);
        return;
      }

      setPublicBookmarks(publicResult.data);

      if (!user) {
        setMyBookmarks([]);
        return;
      }

      setBookmarksLoading(true);
      const myResult = await getMyBookmarks(user.id);
      setBookmarksLoading(false);

      if (myResult.error) {
        setBookmarkError(myResult.error);
        return;
      }

      setMyBookmarks(myResult.data);
    };

    void loadBookmarks();
  }, [user]);

  const isValidUrl = (candidate: string) => {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const resetBookmarkForm = () => {
    setTitle('');
    setUrl('');
    setIsPublic(false);
    setEditingId(null);
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    setAuthLoading(true);

    if (authMode === 'signup') {
      const { user: signedUpUser, error } = await signUpAccount({
        email,
        password,
      });
      setAuthLoading(false);

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (signedUpUser) {
        setAuthMessage('Account created. You can now log in.');
      } else {
        setAuthMessage('Account created. Check your inbox for confirmation.');
      }

      setAuthMode('login');
      return;
    }

    const { user: loggedInUser, error } = await loginAccount({
      email,
      password,
    });
    setAuthLoading(false);

    if (error) {
      const normalized = error.message.toLowerCase();
      if (normalized.includes('invalid login credentials')) {
        setAuthError('No users exist with this account. Please sign up first.');
        return;
      }

      setAuthError(error.message);
      return;
    }

    if (!loggedInUser) {
      setAuthError('No users exist with this account. Please sign up first.');
      return;
    }

    setAuthMessage('Login successful.');
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
        const updated = result.data;
        setMyBookmarks((current) =>
          current.map((bookmark) => (bookmark.id === editingId ? updated : bookmark))
        );

        if (updated.is_public) {
          setPublicBookmarks((current) =>
            current.some((bookmark) => bookmark.id === updated.id)
              ? current.map((bookmark) => (bookmark.id === editingId ? updated : bookmark))
              : [updated, ...current]
          );
        } else {
          setPublicBookmarks((current) =>
            current.filter((bookmark) => bookmark.id !== editingId)
          );
        }
      }

      resetBookmarkForm();
      return;
    }

    const result = await createBookmark(user.id, {
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
      setMyBookmarks((current) => [createdBookmark, ...current]);

      if (createdBookmark.is_public) {
        setPublicBookmarks((current) => [createdBookmark, ...current]);
      }
    }

    resetBookmarkForm();
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

    setMyBookmarks((current) => current.filter((bookmark) => bookmark.id !== bookmarkId));
    setPublicBookmarks((current) => current.filter((bookmark) => bookmark.id !== bookmarkId));

    if (editingId === bookmarkId) {
      resetBookmarkForm();
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

    setUser(null);
  };

  const avatarLetter = user?.email?.charAt(0).toUpperCase() || 'P';

  return (
    <main className="home-screen" aria-live="polite">
      <header className="home-navbar">
        <div className="home-brand">EagerMind</div>

        <nav className="home-links" aria-label="Main navigation">
          <button
            type="button"
            className={authMode === 'login' ? 'nav-pill active' : 'nav-pill'}
            onClick={() => setAuthMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === 'signup' ? 'nav-pill active' : 'nav-pill'}
            onClick={() => setAuthMode('signup')}
          >
            Signup
          </button>
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

      <section className="auth-card">
        <div className="auth-copy">
          <h1>React + Supabase Bookmarks</h1>
          <p className="subtitle">
            Public bookmarks are visible to everyone. Private bookmarks are only
            visible to their owner.
          </p>

          <div className="status-row">
            <span className={`badge ${status}`}>{status.toUpperCase()}</span>
            <p>{message}</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <h2>{authMode === 'login' ? 'Login' : 'Create account'}</h2>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />

          <button type="submit" disabled={authLoading}>
            {authLoading
              ? authMode === 'login'
                ? 'Logging in...'
                : 'Creating account...'
              : authMode === 'login'
              ? 'Login'
              : 'Sign up'}
          </button>

          <button
            type="button"
            className="ghost-link"
            onClick={() => setAuthMode((current) => (current === 'login' ? 'signup' : 'login'))}
          >
            {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>

          {authMessage ? <p className="success-text">{authMessage}</p> : null}
          {authError ? <p className="error-text">{authError}</p> : null}
        </form>
      </section>

      <section className="bookmarks-shell">
        <h2>Your Bookmarks</h2>

        {!user ? (
          <p className="bookmarks-empty">
            Please log in first. Only signed-in users can add, edit, and delete
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
                  <button type="button" className="ghost-btn" onClick={resetBookmarkForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            {bookmarksLoading ? (
              <p className="bookmarks-empty">Loading your bookmarks...</p>
            ) : myBookmarks.length === 0 ? (
              <p className="bookmarks-empty">No bookmarks yet. Add your first one.</p>
            ) : (
              <ul className="bookmarks-list">
                {myBookmarks.map((bookmark) => (
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
        <h2>Public Bookmarks</h2>
        <p className="bookmarks-empty">
          Public bookmarks can be seen by everyone. Private bookmarks stay visible
          only to their owner.
        </p>

        {publicLoading ? (
          <p className="bookmarks-empty">Loading public bookmarks...</p>
        ) : publicBookmarks.length === 0 ? (
          <p className="bookmarks-empty">No public bookmarks found.</p>
        ) : (
          <ul className="bookmarks-list">
            {publicBookmarks.map((bookmark) => (
              <li key={`public-${bookmark.id}`} className="bookmark-item">
                <div className="bookmark-main">
                  <h3>{bookmark.title}</h3>
                  <a href={bookmark.url} target="_blank" rel="noreferrer">
                    {bookmark.url}
                  </a>
                </div>

                <div className="bookmark-side">
                  <span className="visibility-chip public">Public</span>
                  <span className="read-only-note">Read only</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
