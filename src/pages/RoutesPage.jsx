import React, { useState, useEffect } from 'react'
import { useDemo } from '../context/DemoContext'
import { getRoutes, saveRoute } from '../services/dataService'
import './RoutesPage.css'

const ROUTES = [
  {
    id: 1, name: 'Esplanade Loop', city: 'Boston, MA',
    distance: '4.2 mi', surface: 'Paved', elevation: 'Flat',
    aqi: 42, aqiLabel: 'Good', aqiClass: 'good',
    pollen: 'Low', wind: 'Light breeze',
    rating: 4.9, reviews: 284,
    tags: ['Flat', 'Riverside', 'Low Pollen', 'Shaded'],
    emoji: '🌊',
  },
  {
    id: 2, name: "Sloan's Lake Loop", city: 'Denver, CO',
    distance: '2.8 mi', surface: 'Paved', elevation: 'Flat',
    aqi: 55, aqiLabel: 'Moderate', aqiClass: 'mod',
    pollen: 'Low', wind: 'Calm',
    rating: 4.7, reviews: 141,
    tags: ['Flat', 'Lake Air', 'Low Dust'],
    emoji: '🏔️',
  },
  {
    id: 3, name: 'Lakefront Trail', city: 'Chicago, IL',
    distance: '5.0 mi', surface: 'Paved', elevation: 'Flat',
    aqi: 38, aqiLabel: 'Good', aqiClass: 'good',
    pollen: 'Moderate', wind: 'Windy',
    rating: 4.8, reviews: 409,
    tags: ['Clean Air', 'Scenic', 'Windy'],
    emoji: '🌆',
  },
  {
    id: 4, name: 'Balboa Park Loop', city: 'San Diego, CA',
    distance: '3.5 mi', surface: 'Mixed', elevation: 'Rolling',
    aqi: 28, aqiLabel: 'Good', aqiClass: 'good',
    pollen: 'Low', wind: 'Light',
    rating: 4.9, reviews: 320,
    tags: ['Good AQI', 'Shaded', 'Scenic'],
    emoji: '🌴',
  },
  {
    id: 5, name: 'Central Park Loop', city: 'New York, NY',
    distance: '6.1 mi', surface: 'Paved', elevation: 'Rolling',
    aqi: 61, aqiLabel: 'Moderate', aqiClass: 'mod',
    pollen: 'High', wind: 'Variable',
    rating: 4.6, reviews: 892,
    tags: ['Iconic', 'Busy', 'High Pollen'],
    emoji: '🗽',
  },
  {
    id: 6, name: 'Burke–Gilman Trail', city: 'Seattle, WA',
    distance: '4.8 mi', surface: 'Paved', elevation: 'Gentle',
    aqi: 31, aqiLabel: 'Good', aqiClass: 'good',
    pollen: 'Low', wind: 'Light',
    rating: 4.8, reviews: 215,
    tags: ['Low AQI', 'Tree-Lined', 'Quiet'],
    emoji: '🌲',
  },
]

const AQI_CLASSES = { good: 'tag-sage', mod: 'tag-amber', unhealthy: 'tag-rust' }

export default function RoutesPage() {
  const { isDemo } = useDemo()
  const [allRoutes, setAllRoutes] = useState([])
  const [search, setSearch] = useState('')
  const [filterAqi, setFilterAqi] = useState('all')
  const [saved, setSaved] = useState(new Set([1]))

  useEffect(() => {
    getRoutes({ search, aqiFilter: filterAqi }, isDemo)
      .then(d => setAllRoutes(Array.isArray(d) ? d : ROUTES))
  }, [isDemo, search, filterAqi])

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = allRoutes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    const matchAqi = filterAqi === 'all' || r.aqiClass === filterAqi
    return matchSearch && matchAqi
  })

  return (
    <div className="page-container routes-page">
      <div className="routes-header">
        <div>
          <span className="section-label">Safe Routes</span>
          <h1 className="section-title">Community-rated,<br /><em>breath-tested.</em></h1>
          <p className="section-sub">Every route tagged for AQI, pollen, elevation and surface — by runners like you.</p>
        </div>
        <button className="btn btn-primary">+ Submit a Route</button>
      </div>

      {/* Search & filter bar */}
      <div className="routes-toolbar">
        <input
          className="input routes-search"
          placeholder="🔍  Search by name or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search routes"
        />
        <div className="aqi-filters" role="group" aria-label="Filter by AQI">
          {[
            { val: 'all',  label: 'All AQI' },
            { val: 'good', label: '✅ Good' },
            { val: 'mod',  label: '⚠️ Moderate' },
          ].map(f => (
            <button
              key={f.val}
              className={`filter-btn${filterAqi === f.val ? ' filter-btn--active' : ''}`}
              onClick={() => setFilterAqi(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>No routes found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="routes-grid">
          {filtered.map(route => (
            <div key={route.id} className="card route-card">
              <div className="route-map">
                <span className="route-map-emoji" aria-hidden="true">{route.emoji}</span>
                <button
                  className={`save-btn${saved.has(route.id) ? ' save-btn--saved' : ''}`}
                  onClick={() => toggleSave(route.id)}
                  aria-label={saved.has(route.id) ? 'Unsave route' : 'Save route'}
                >
                  {saved.has(route.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="route-body">
                <div className="route-title-row">
                  <h3 className="route-name">{route.name}</h3>
                  <span className={`tag ${AQI_CLASSES[route.aqiClass]}`}>AQI {route.aqi}</span>
                </div>
                <p className="route-city">📍 {route.city}</p>
                <div className="route-stats">
                  <span>📏 {route.distance}</span>
                  <span>🛣️ {route.surface}</span>
                  <span>⛰️ {route.elevation}</span>
                </div>
                <div className="route-env">
                  <span className={`tag ${AQI_CLASSES[route.aqiClass]}`}>{route.aqiLabel}</span>
                  <span className="tag tag-earth">🌿 Pollen: {route.pollen}</span>
                  <span className="tag tag-sky">💨 {route.wind}</span>
                </div>
                <div className="route-tags">
                  {route.tags.map(t => <span key={t} className="tag tag-earth">{t}</span>)}
                </div>
                <div className="route-footer">
                  <span className="route-rating">⭐ {route.rating} · {route.reviews} asthma runners</span>
                  <button className="btn btn-sm btn-outline">View Route</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
