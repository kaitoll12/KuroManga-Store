const express = require('express')
const Stripe = require('stripe')
const { pool } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
})

router.post('/session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { shipping_address, phone, notes } = req.body || {}

    if (!shipping_address || !phone) {
      return res.status(400).json({
        error: 'Datos de envío requeridos',
        message: 'Debes proporcionar dirección y teléfono',
      })
    }

    const [cartItems] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.price,
        p.image,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [userId])

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Carrito vacío',
        message: 'No puedes iniciar pago sin items en el carrito',
      })
    }

    const insufficient = cartItems.filter(i => i.stock_quantity < i.quantity)
    if (insufficient.length > 0) {
      return res.status(400).json({
        error: 'Stock insuficiente',
        message: `Sin stock para: ${insufficient.map(i => i.title).join(', ')}`,
      })
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'clp',
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }))

    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: String(userId),
        shipping_address,
        phone,
        notes: notes || '',
      },
    })

    res.json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('Create checkout session error:', error)
    res.status(500).json({
      error: 'No se pudo iniciar el pago',
      message: 'Error creando la sesión de pago',
    })
  }
})

module.exports = router