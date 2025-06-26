import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract form fields
    const name = formData.get('name') as string
    const date = formData.get('date') as string
    const trackingNumber = formData.get('trackingNumber') as string
    const image1 = formData.get('image1') as File
    const image2 = formData.get('image2') as File

    // Validate required fields
    if (!name || !date || !trackingNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!image1 || !image2) {
      return NextResponse.json(
        { error: 'Both images are required' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(image1.type) || !allowedTypes.includes(image2.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file sizes (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (image1.size > maxSize || image2.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB per image.' },
        { status: 400 }
      )
    }

    // TODO: Here you would typically:
    // 1. Upload images to S3 using pre-signed URLs
    // 2. Store session data in PostgreSQL
    // 3. Generate session_id and return it
    
    // For now, we'll simulate a successful response
    const sessionData = {
      session_id: `session_${Date.now()}`,
      operator_name: name,
      date: date,
      tracking_number: trackingNumber,
      image1_name: image1.name,
      image2_name: image2.name,
      created_at: new Date().toISOString()
    }

    console.log('Session data received:', sessionData)

    return NextResponse.json({
      success: true,
      session_id: sessionData.session_id,
      message: 'Session created successfully'
    })

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 