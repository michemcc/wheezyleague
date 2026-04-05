'use strict'
const express = require('express')
const db      = require('../db')

const router = express.Router()

// GET /api/posts?page=1&filter=all
router.get('/', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page, 10) || 1)
    const filter = req.query.filter || 'all'
    const result = await db.listPosts({ page, filter })
    res.json(result)
  } catch (err) { next(err) }
})

// POST /api/posts
router.post('/', async (req, res, next) => {
  try {
    const { body, filter } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'Post body is required.' })
    const post = await db.createPost({
      sub:    req.auth.sub,
      name:   req.auth.name,
      body,
      filter,
    })
    res.status(201).json(post)
  } catch (err) { next(err) }
})

// POST /api/posts/:id/like
router.post('/:id/like', async (req, res, next) => {
  try {
    const post = await db.likePost(req.params.id, 1)
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    res.json({ postId: post.id, likes: post.likes })
  } catch (err) { next(err) }
})

// DELETE /api/posts/:id/like
router.delete('/:id/like', async (req, res, next) => {
  try {
    const post = await db.likePost(req.params.id, -1)
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    res.json({ postId: post.id, likes: post.likes })
  } catch (err) { next(err) }
})

module.exports = router
