import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { sendEmail } from "@/libs/resend";
import { messageReceivedEmail } from "@/libs/email-templates";

// GET /api/conversations/[conversationId]/messages - Get all messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Verify user is part of conversation
    const conversation = await Conversation.findById(params.conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const messages = await Message.find({
      conversationId: params.conversationId,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: params.conversationId,
        senderId: { $ne: session.user.id },
        isRead: false,
      },
      { isRead: true }
    );

    // Note: We DON'T reset the cooldown here on purpose
    // This prevents email spam during active conversations
    // The 1-hour cooldown will naturally expire if they stop chatting

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages - Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Verify user is part of conversation
    const conversation = await Conversation.findById(params.conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get sender info
    const sender = await User.findById(session.user.id).select("name username image preferredLanguage");

    // Create message
    const message = await Message.create({
      conversationId: params.conversationId,
      senderId: session.user.id,
      senderName: sender?.name || "Unknown",
      senderImage: sender?.image || "",
      text: text.trim(),
    });

    // Update conversation
    conversation.lastMessage = text.trim().substring(0, 100);
    conversation.lastMessageAt = new Date();
    conversation.lastMessageBy = session.user.id;
    await conversation.save();

    // Get recipient(s) - exclude the sender
    const recipientIds = conversation.participants.filter(
      (p: any) => p.toString() !== session.user.id
    );

    // Send email notification to each recipient (non-blocking) with cooldown
    recipientIds.forEach(async (recipientId: any) => {
      try {
        const recipient = await User.findById(recipientId).select(
          "email name notificationSettings preferredLanguage"
        );

        // Check if email notifications are enabled
        if (
          recipient?.email &&
          recipient.notificationSettings?.emailNotifications !== false &&
          recipient.notificationSettings?.messageNotifications !== false
        ) {
          // Cooldown mechanism: Only send email if it's been more than 1 hour since last email
          // This prevents spam during active conversations (like LinkedIn does)
          const lastEmailSent = conversation.lastEmailNotificationSent?.get(recipientId.toString());
          const cooldownPeriod = 60 * 60 * 1000; // 1 hour in milliseconds
          const now = new Date();

          if (!lastEmailSent || (now.getTime() - new Date(lastEmailSent).getTime() > cooldownPeriod)) {
            // Send the email
            const emailTemplate = messageReceivedEmail(
              {
                name: sender?.name,
                username: sender?.username,
                image: sender?.image,
              },
              {
                name: recipient.name,
                email: recipient.email,
                _id: recipientId,
              },
              text.trim(),
              params.conversationId,
              recipient.preferredLanguage || 'en'
            );

            sendEmail({
              to: recipient.email,
              ...emailTemplate,
            }).catch(err => console.error('Failed to send message notification email:', err));

            // Update the last email sent timestamp for this recipient
            conversation.lastEmailNotificationSent = conversation.lastEmailNotificationSent || new Map();
            conversation.lastEmailNotificationSent.set(recipientId.toString(), now);
            await conversation.save();
          } else {
            console.log(`Skipping email to ${recipientId} - cooldown active (last sent: ${lastEmailSent})`);
          }
        }
      } catch (err) {
        console.error('Error processing message notification:', err);
      }
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

