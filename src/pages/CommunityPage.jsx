import React, { useState, useEffect, useRef } from 'react'
import { useDemo } from '../context/DemoContext'
import { getPosts, toggleLike, createPost, deletePost, getComments, addComment } from '../services/dataService'
import { useAuth0 } from '@auth0/auth0-react'
import './CommunityPage.css'

const INITIAL_POSTS = [
  { id: 1, emoji: '🧑‍🦱', name: 'Marcus T.', location: 'Boston', time: '2h ago', badge: 'Breath Warrior', badgeClass: 'tag-rust', body: `Just hit my first 10K with no flare-ups! I've been using the trigger log for 6 weeks and finally cracked the pattern — cold + dry air = trouble. Running indoors on 30°F days changed everything.`, likes: 142, comments: 28, liked: false, userId: null },
  { id: 2, emoji: '👩‍🦰', name: 'Leila H.',  location: 'Denver',  time: '5h ago', badge: 'Pacer',         badgeClass: 'tag-sky',  body: `Anyone found good mask options for cold-weather runs? My pulmonologist suggested one but it fogs my glasses something terrible 😅`,                                                                                                              likes: 87,   comments: 54, liked: false, userId: null },
  { id: 3, emoji: '🧑🏽', name: 'Sam O.',    location: 'Chicago', time: '1d ago', badge: 'Newbie',        badgeClass: 'tag-sage', body: `First post here! Just diagnosed and felt like my running days were over. Found The Wheezy League through my doctor and… 14,000 of you doing this? Not alone. 😭🏃‍♂️`,                                                              likes: 3100, comments: 412, liked: false, userId: null },
  { id: 4, emoji: '🧑‍🦳', name: 'David K.', location: 'Seattle', time: '2d ago', badge: 'Pacer',         badgeClass: 'tag-sky',  body: `Week 8 check-in: started barely able to run 5 minutes without wheezing. Today: 10-min warm-up, 3 miles at tempo, walked home feeling superhuman. The 5-3-5 breathing rhythm from the forums was everything.`,                            likes: 211,  comments: 37,  liked: false, userId: null },
]

const LEADERBOARD = [
  { name: 'Marcus T.',  pts: '4,200 pts', rank: 1 },
  { name: 'Priya K.',   pts: '3,850 pts', rank: 2 },
  { name: 'David K.',   pts: '3,100 pts', rank: 3 },
  { name: 'Leila H.',   pts: '2,750 pts', rank: 4 },
  { name: 'Sam O.',     pts: '1,200 pts', rank: 5 },
]

// ── Single post card with inline comments ─────────────────────────────────────
function PostCard({ post, currentUserId, isDemo, onLike, onDelete }) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments,     setComments]     = useState([])
  const [loadingCmts,  setLoadingCmts]  = useState(false)
  const [newComment,   setNewComment]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const textareaRef = useRef(null)

  const toggleComments = async () => {
    if (!commentsOpen && comments.length === 0) {
      setLoadingCmts(true)
      const data = await getComments(post.id, isDemo)
      setComments(Array.isArray(data) ? data : [])
      setLoadingCmts(false)
    }
    setCommentsOpen(o => !o)
    if (!commentsOpen) setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    const c = await addComment(post.id, newComment.trim(), isDemo)
    setComments(prev => [...prev, c])
    setNewComment('')
    setSubmitting(false)
  }

  const isOwn = currentUserId && (post.userId === currentUserId || post.userId === undefined)

  return (
    <div className="card post-card">
      <div className="post-header">
        <div className="avatar avatar-md">
          {post.picture ? <img src={post.picture} alt={post.name} /> : <span>{post.emoji || post.name?.[0]}</span>}
        </div>
        <div className="post-meta-block">
          <strong className="post-name">{post.name}</strong>
          <span className="post-meta">{post.location} · {post.time}</span>
        </div>
        <span className={`tag ${post.badgeClass}`}>{post.badge}</span>
        {isOwn && (
          <button className="post-delete-btn" onClick={() => onDelete(post.id)} aria-label="Delete post" title="Delete post">
            ✕
          </button>
        )}
      </div>

      <p className="post-body">{post.body}</p>

      <div className="post-actions">
        <button
          className={`post-btn${post.liked ? ' post-btn--liked' : ''}`}
          onClick={() => onLike(post.id)}
          aria-label={`${post.liked ? 'Unlike' : 'Like'} post`}
        >
          {post.liked ? '❤️' : '🤍'} {post.likes.toLocaleString()}
        </button>
        <button className={`post-btn${commentsOpen ? ' post-btn--active' : ''}`} onClick={toggleComments}>
          💬 {post.comments} {commentsOpen ? '▴' : '▾'}
        </button>
      </div>

      {/* Comments section */}
      {commentsOpen && (
        <div className="comments-section">
          {loadingCmts && <p className="comments-loading">Loading…</p>}
          {!loadingCmts && comments.length === 0 && (
            <p className="comments-empty">No comments yet. Be the first!</p>
          )}
          {!loadingCmts && comments.map(c => (
            <div key={c.id} className="comment-row">
              <div className="avatar avatar-sm comment-avatar">
                {c.picture ? <img src={c.picture} alt={c.name} /> : <span>{c.name?.[0] || '?'}</span>}
              </div>
              <div className="comment-body-wrap">
                <span className="comment-name">{c.name}</span>
                <p className="comment-body">{c.body}</p>
              </div>
            </div>
          ))}
          {/* Add comment */}
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              ref={textareaRef}
              className="input comment-input"
              placeholder="Add a comment…"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={2}
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? '…' : 'Reply'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user } = useAuth0()
  const { isDemo } = useDemo()
  const [posts,        setPosts]        = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [newPost,      setNewPost]      = useState('')
  const [filter,       setFilter]       = useState('all')

  useEffect(() => {
    setLoadingPosts(true)
    getPosts({ filter }, isDemo)
      .then(data => setPosts(Array.isArray(data) ? data : (isDemo ? INITIAL_POSTS : [])))
      .catch(() => setPosts(isDemo ? INITIAL_POSTS : []))
      .finally(() => setLoadingPosts(false))
  }, [isDemo, filter])

  const handleLike = (id) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
    const post = posts.find(p => p.id === id)
    if (post) toggleLike(id, post.liked, isDemo).catch(() => {})
  }

  const handlePost = (e) => {
    e.preventDefault()
    if (!newPost.trim()) return
    const post = {
      id: Date.now(),
      emoji: user?.name?.[0] || '🏃',
      picture: user?.picture,
      name: user?.name || 'You',
      location: 'Your city',
      time: 'Just now',
      badge: 'Member', badgeClass: 'tag-earth',
      body: newPost,
      likes: 0, comments: 0, liked: false,
      userId: user?.sub,
    }
    setPosts(prev => [post, ...prev])
    setNewPost('')
    createPost({ body: newPost }, isDemo).catch(() => {})
  }

  const handleDelete = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id))
    deletePost(id, isDemo).catch(() => {})
  }

  return (
    <div className="page-container community-page">
      <div className="community-header">
        <div>
          <span className="section-label">Community</span>
          <h1 className="section-title">You're not running <em>alone.</em></h1>
        </div>
        <div className="community-filters">
          {['all', 'stories', 'questions', 'tips'].map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="community-layout">
        {/* Feed column */}
        <div className="posts-col">
          {/* Compose */}
          <div className="card compose-card">
            <div className="compose-top">
              <div className="avatar avatar-md">
                {user?.picture ? <img src={user.picture} alt={user.name} /> : <span>{user?.name?.[0] || '?'}</span>}
              </div>
              <form className="compose-form" onSubmit={handlePost}>
                <textarea
                  className="input textarea compose-input"
                  placeholder="Share a run, ask a question, or encourage a fellow runner…"
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  rows={3}
                  aria-label="New post"
                />
                <div className="compose-actions">
                  <div className="compose-tags-quick">
                    <button type="button" className="quick-tag" onClick={() => setNewPost(p => p + ' #RunStory')}>🏃 Story</button>
                    <button type="button" className="quick-tag" onClick={() => setNewPost(p => p + ' #Question')}>💬 Question</button>
                    <button type="button" className="quick-tag" onClick={() => setNewPost(p => p + ' #Tip')}>💡 Tip</button>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newPost.trim()}>Post</button>
                </div>
              </form>
            </div>
          </div>

          {loadingPosts && <p className="posts-loading">Loading posts…</p>}

          {!loadingPosts && posts.length === 0 && !isDemo && (
            <div className="card card--pad posts-empty">
              <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', textAlign: 'center' }}>
                No posts yet — be the first to share something!
              </p>
            </div>
          )}

          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.sub}
              isDemo={isDemo}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="sidebar-col">
          <div className="card sidebar-card">
            <p className="sidebar-title">🏆 Leaderboard</p>
            {LEADERBOARD.map(m => (
              <div key={m.rank} className="lb-row">
                <span className={`lb-rank${m.rank <= 3 ? ' lb-rank--top' : ''}`}>{m.rank}</span>
                <div className="lb-info"><strong>{m.name}</strong></div>
                <span className="lb-pts">{m.pts}</span>
              </div>
            ))}
          </div>

          <div className="card sidebar-card">
            <p className="sidebar-title">🔥 Trending</p>
            <div className="trending-tags">
              {['#ColdWeatherRuns','#BreathControl','#5K','#MorningRun','#AsthmaRunner'].map(t => (
                <button key={t} className="trend-tag">{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
