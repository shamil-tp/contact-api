import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS so your portfolio frontend can communicate with this API
app.use('*', cors({
  origin: '*', // Replace '*' with your portfolio domain in production (e.g. 'https://yourdomain.com')
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}))

// POST /api/contact - Create a new message
app.post('/api/contact', async (c) => {
  try {
    const { name, email, message } = await c.req.json<{
      name: string
      email: string
      message: string
    }>()

    // Simple server-side validation
    if (!name || !email || !message) {
      return c.json({ error: 'All fields (name, email, message) are required' }, 400)
    }

    const id = crypto.randomUUID()

    await c.env.DB.prepare(
      'INSERT INTO messages (id, name, email, message) VALUES (?, ?, ?, ?)'
    )
      .bind(id, name, email, message)
      .run()

    return c.json({ success: true, message: 'Message sent successfully!' }, 201)
  } catch (err) {
    return c.json({ error: 'Failed to save message' }, 500)
  }
})

// GET /api/contact - Retrieve messages (For you to view submissions)
app.get('/api/contact', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM messages ORDER BY created_at DESC'
  ).all()

  return c.json({ messages: results })
})

export default app