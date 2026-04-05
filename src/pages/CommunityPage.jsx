import React, { useState, useEffect } from 'react'
import { useDemo } from '../context/DemoContext'
import { getPosts } from '../services/dataService'
import { useAuth0 } from '@auth0/auth0-react'
import './CommunityPage.css'

const INITIAL_POSTS = [
  {
    id: 1, emoji: '🧑‍🦱', name: 'Marcus T.', location: 'Boston', time: '2h ago',
    badge: 'Breath Warrior', badgeClass: 'tag-rust',
    body: `Just hit my first 10K with no flare-ups! I've been using the BreathZone trigger log for 6 weeks and finally cracked the pattern — cold + dry air = trouble. Running indoors on 30°F days changed everything.`,
    likes: 142, comments: 28, liked: false,
  },
  {
    id: 2, emoji: '👩‍🦰', name: 'Leila H.', location: 'Denver', time: '5h ago',
    badge: 'Pacer', badgeClass: 'tag-sky',
    body: `Question for the community: anyone found good mask options for cold-weather runs? My pulmonologist suggested one but it fogs my glasses something terrible 😅`,
    likes: 87, comments: 54, liked: false,
  },
  {
    id: 3, emoji: '🧑🏽', name: 'Sam O.', location: 'Chicago', time: '1d ago',
    badge: 'Newbie', badgeClass: 'tag-sage',
    body: `First post here! Just diagnosed with exercise-induced asthma and felt like my running days were over. Found The Wheezy League through my doctor and… there are 14,000 of you doing this? I'm not alone. I'm already crying 😭🏃‍♂️`,
    likes: 3100, comments: 412, liked: false,
  },
  {
    id: 4, emoji: '🧑‍🦳', name: 'David K.', location: 'Seattle', time: '2d ago',
    badge: 'Pacer', badgeClass: 'tag-sky',
    body: `Week 8 check-in: When I started I could barely run a 5-minute mile without wheezing. Today I did a 10-minute warm-up, 3 miles at tempo, and walked home feeling like a superhero. Your "5-3-5 breathing rhythm" tip from the forums was everything.`,
    likes: 211, comments: 37, liked: false,
  },
]

export default function CommunityPage() {
  const { user } = useAuth0()
  const { isDemo } = useDemo()
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoadingPosts(true)
    getPosts({ filter }, isDemo)
      .then(data => setPosts(Array.isArray(data) ? data : INITIAL_POSTS))
      .catch(() => setPosts(isDemo ? INITIAL_POSTS : []))
      .finally(() => setLoadingPosts(false))
  }, [isDemo, filter])

  const handleLike = (id) => {
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ))
  }

  const handlePost = (e) => {
    e.preventDefault()
    if (!newPost.trim()) return
    const post = {
      id: Date.now(),
      emoji: user?.picture ? null : '🏃',
      picture: user?.picture,
      name: user?.name || 'You',
      location: 'Your city',
      time: 'Just now',
      badge: 'Member', badgeClass: 'tag-earth',
      body: newPost,
      likes: 0, comments: 0, liked: false,
    }
    setPosts(prev => [post, ...prev])
    setNewPost('')
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
            <button
              key={f}
              className={`filter-btn${filter === f ? ' filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="community-layout">
        <div className="posts-col">
        {!isDemo && (
          <div className="pending-banner">
            <span className="pending-banner-icon">🔌</span>
            <div><strong>Live Mode</strong><p>Posts will load from your backend API once connected.</p></div>
          </div>
        )}
          {/* Compose */}
          <div className="card compose-card">
            <div className="compose-top">
              <div className="avatar avatar-md">
                {user?.picture
                  ? <img src={user.picture} alt={user.name} />
                  : <span>{user?.name?.[0] || '?'}</span>
                }
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
                    <button type="button" className="quick-tag">🏃 Run Story</button>
                    <button type="button" className="quick-tag">💬 Question</button>
                    <button type="button" className="quick-tag">💡 Tip</button>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newPost.trim()}>
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Posts */}
          {posts.map(post => (
            <div key={post.id} className="card post-card">
              <div className="post-header">
                <div className="avatar avatar-md">
                  {post.picture
                    ? <img src={post.picture} alt={post.name} />
                    : <span>{post.emoji}</span>
                  }
                </div>
                <div className="post-meta-block">
                  <strong className="post-name">{post.name}</strong>
                  <span className="post-meta">{post.location} · {post.time}</span>
                </div>
                <span className={`tag ${post.badgeClass}`}>{post.badge}</span>
              </div>
              <p className="post-body">{post.body}</p>
              <div className="post-actions">
                <button
                  className={`post-btn${post.liked ? ' post-btn--liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                  aria-label={`${post.liked ? 'Unlike' : 'Like'} post`}
                >
                  {post.liked ? '❤️' : '🤍'} {post.likes.toLocaleString()}
                </button>
                <button className="post-btn">💬 {post.comments}</button>
                <button className="post-btn">🔁 Share</button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="community-sidebar">
          <div className="card sidebar-card">
            <h3 className="sidebar-title">🌟 Top Members</h3>
            {[
              { emoji: '🧑‍🦱', name: 'Marcus T.', pts: '1,240 pts', badge: 'Breath Warrior' },
              { emoji: '👩', name: 'Aisha P.', pts: '980 pts', badge: 'Pacer' },
              { emoji: '🧑🏻', name: 'Leo M.', pts: '870 pts', badge: 'Sprinter' },
            ].map((m, i) => (
              <div key={i} className="member-row">
                <span className="member-rank">#{i + 1}</span>
                <div className="avatar avatar-sm">{m.emoji}</div>
                <div className="member-info">
                  <strong>{m.name}</strong>
                  <span>{m.badge}</span>
                </div>
                <span className="member-pts">{m.pts}</span>
              </div>
            ))}
          </div>

          <div className="card sidebar-card">
            <h3 className="sidebar-title">🔥 Trending Topics</h3>
            {['#ColdWeatherRunning', '#InhalerTips', '#5KGoal', '#BreathTechnique', '#AsthmaAndRunning'].map(tag => (
              <button key={tag} className="trend-tag">{tag}</button>
            ))}
          </div>

          <div className="card sidebar-card sidebar-card--dark">
            <h3 className="sidebar-title sidebar-title--light">💨 BreathZone Tip</h3>
            <p className="sidebar-tip">Run into the wind on the way out, with the wind on the way back. This keeps cold air from hitting you when you're most tired.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
