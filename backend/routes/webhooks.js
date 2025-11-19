const express = require('express')
const Stripe = require('stripe')
const { pool } = require('../config/database')

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
})

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = parseInt(session.metadata?.user_id)
    const shipping_address = session.metadata?.shipping_address || ''
    const phone = session.metadata?.phone || ''
    const notes = session.metadata?.notes || null

    if (!userId) {
      console.error('Missing user_id in session metadata')
      return res.json({ received: true })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [cartItems] = await connection.execute(`
        SELECT ci.product_id, ci.quantity, p.title, p.price, p.stock_quantity
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `, [userId])

      if (cartItems.length === 0) {
        await connection.commit()
        connection.release()
        return res.json({ received: true })
      }

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const orderNumber = 'ORD-' + String(Date.now()).slice(-8)

      const [orderResult] = await connection.execute(`
        INSERT INTO orders (user_id, order_number, total_amount, shipping_address, phone, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
      `, [userId, orderNumber, totalAmount, shipping_address, phone, notes])

      const orderId = orderResult.insertId

      for (const item of cartItems) {
        await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price])

        await connection.execute(`
          UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `, [item.quantity, item.product_id])
      }

      await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId])

      await connection.commit()
    } catch (err) {
      await connection.rollback()
      console.error('Error processing checkout.session.completed:', err)
    } finally {
      connection.release()
    }
  }

  res.json({ received: true })
})

module.exports = router