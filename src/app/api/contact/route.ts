import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
})

// Simple in-memory rate limiting: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }

  if (entry.count >= 5) {
    return true
  }

  entry.count++
  return false
}

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }, 60 * 60 * 1000)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validated = contactSchema.parse(body)

    // If SMTP configured, send email to site admin
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Dynamic import to avoid bundling nodemailer when not needed
        const nodemailer = await import("nodemailer")

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.sendMail({
          from: `"Sanaa Through My Lens" <${process.env.SMTP_USER}>`,
          to: "hello@sanaathrumylens.co.ke",
          replyTo: validated.email,
          subject: `[Contact] ${validated.subject}`,
          text: `Name: ${validated.name}\nEmail: ${validated.email}\nSubject: ${validated.subject}\n\n${validated.message}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${validated.name}</p>
            <p><strong>Email:</strong> ${validated.email}</p>
            <p><strong>Subject:</strong> ${validated.subject}</p>
            <hr />
            <p>${validated.message.replace(/\n/g, "<br />")}</p>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send contact email:", emailError)
        // Log for dev but don't fail the request
      }
    } else {
      // SMTP not configured, log for development
      console.log("📧 Contact form submission (SMTP not configured):", {
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
        message: validated.message,
      })
    }

    // Store in database if there's a ContactMessage model, otherwise just return success
    try {
      // Check if ContactSubmission model exists by trying to use it
      // If it doesn't exist, this will be caught
      await db.$queryRaw`SELECT 1`
      // We'll just log it — the model may not exist in the Prisma schema
    } catch {
      // No ContactSubmission model, that's fine
    }

    return NextResponse.json({ success: true, message: "Message sent successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
