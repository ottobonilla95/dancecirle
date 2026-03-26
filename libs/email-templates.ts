/**
 * Email templates for transactional notifications
 * These templates are used for sending transactional emails to users
 */

import config from "@/config";

interface UserData {
  name?: string;
  email?: string;
  username?: string;
  image?: string;
  _id?: string;
}

type Locale = 'en' | 'es';

// Email translations
const emailTranslations = {
  en: {
    friendRequest: {
      subject: (name: string) => `${name} sent you a friend request on ${config.appName}! 👋`,
      header: 'New Friend Request!',
      greeting: (name: string) => `Hi ${name}!`,
      wantsToConnect: 'wants to connect with you!',
      viewButton: 'View Friend Request',
      footer1: 'Connect with dancers worldwide and grow your network! 🌍',
      footer2: (appName: string) => `You're receiving this because someone sent you a friend request on ${appName}.`,
      managePrefs: 'Manage notification preferences'
    },
    friendAccepted: {
      subject: (name: string) => `${name} accepted your friend request! 🎉`,
      header: 'Friend Request Accepted!',
      greeting: (name: string) => `Hi ${name}!`,
      greatNews: (name: string) => `Great news! <strong>${name}</strong> accepted your friend request.`,
      newFriend: 'Your new friend',
      viewButton: 'View Profile',
      footer1: "You're now connected! Start exploring their dance journey. 💃🕺",
      footer2: (appName: string) => `You're receiving this because your friend request was accepted on ${appName}.`,
      managePrefs: 'Manage notification preferences'
    },
    profileLiked: {
      subject: (name: string) => `${name} liked your profile! ❤️`,
      header: 'Someone Liked Your Profile!',
      greeting: (name: string) => `Hi ${name}!`,
      likedProfile: 'liked your profile!',
      viewButton: 'View Their Profile',
      footer1: "Maybe it's time to connect? Send them a friend request! 💃🕺",
      footer2: (appName: string) => `You're receiving this because someone liked your profile on ${appName}.`,
      managePrefs: 'Manage notification preferences'
    },
    messageReceived: {
      subject: (name: string) => `${name} sent you a message! 💬`,
      header: 'New Message!',
      greeting: (name: string) => `Hi ${name}!`,
      sentMessage: 'sent you a message:',
      viewButton: 'View Message',
      footer1: "Reply to continue the conversation! 💬",
      footer2: (appName: string) => `You're receiving this because someone sent you a message on ${appName}.`,
      managePrefs: 'Manage notification preferences'
    },
    campaign: {
      defaultButton: 'Learn More',
      footer: (appName: string) => `You're receiving this because you're part of the ${appName} community.`,
      managePrefs: 'Manage notification preferences'
    }
  },
  es: {
    friendRequest: {
      subject: (name: string) => `¡${name} te envió una solicitud de amistad en ${config.appName}! 👋`,
      header: '¡Nueva Solicitud de Amistad!',
      greeting: (name: string) => `¡Hola ${name}!`,
      wantsToConnect: '¡quiere conectar contigo!',
      viewButton: 'Ver Solicitud de Amistad',
      footer1: '¡Conecta con bailarines de todo el mundo y expande tu red! 🌍',
      footer2: (appName: string) => `Recibes esto porque alguien te envió una solicitud de amistad en ${appName}.`,
      managePrefs: 'Gestionar preferencias de notificaciones'
    },
    friendAccepted: {
      subject: (name: string) => `¡${name} aceptó tu solicitud de amistad! 🎉`,
      header: '¡Solicitud de Amistad Aceptada!',
      greeting: (name: string) => `¡Hola ${name}!`,
      greatNews: (name: string) => `¡Buenas noticias! <strong>${name}</strong> aceptó tu solicitud de amistad.`,
      newFriend: 'Tu nuevo amigo',
      viewButton: 'Ver Perfil',
      footer1: '¡Ya están conectados! Comienza a explorar su viaje de baile. 💃🕺',
      footer2: (appName: string) => `Recibes esto porque tu solicitud de amistad fue aceptada en ${appName}.`,
      managePrefs: 'Gestionar preferencias de notificaciones'
    },
    profileLiked: {
      subject: (name: string) => `¡A ${name} le gustó tu perfil! ❤️`,
      header: '¡A Alguien le Gustó tu Perfil!',
      greeting: (name: string) => `¡Hola ${name}!`,
      likedProfile: '¡le gustó tu perfil!',
      viewButton: 'Ver su Perfil',
      footer1: '¿Quizás es momento de conectar? ¡Envíale una solicitud de amistad! 💃🕺',
      footer2: (appName: string) => `Recibes esto porque a alguien le gustó tu perfil en ${appName}.`,
      managePrefs: 'Gestionar preferencias de notificaciones'
    },
    messageReceived: {
      subject: (name: string) => `¡${name} te envió un mensaje! 💬`,
      header: '¡Nuevo Mensaje!',
      greeting: (name: string) => `¡Hola ${name}!`,
      sentMessage: 'te envió un mensaje:',
      viewButton: 'Ver Mensaje',
      footer1: '¡Responde para continuar la conversación! 💬',
      footer2: (appName: string) => `Recibes esto porque alguien te envió un mensaje en ${appName}.`,
      managePrefs: 'Gestionar preferencias de notificaciones'
    },
    campaign: {
      defaultButton: 'Ver Más',
      footer: (appName: string) => `Recibes esto porque eres parte de la comunidad ${appName}.`,
      managePrefs: 'Gestionar preferencias de notificaciones'
    }
  }
};

/**
 * Generate unsubscribe footer HTML
 */
function getUnsubscribeFooter(userId: string, type: string, locale: Locale = 'en') {
  const unsubscribeUrl = `https://${config.domainName}/api/unsubscribe?userId=${userId}&type=${type}`;
  const unsubscribeAllUrl = `https://${config.domainName}/api/unsubscribe?userId=${userId}&type=all`;
  const settingsUrl = `https://${config.domainName}/${locale}/settings`;
  
  const text = locale === 'es' 
    ? `<a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Cancelar este tipo de notificaciones</a> | <a href="${unsubscribeAllUrl}" style="color: #999; text-decoration: underline;">Cancelar todas las notificaciones</a> | <a href="${settingsUrl}" style="color: #667eea;">Gestionar preferencias</a>`
    : `<a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from this type</a> | <a href="${unsubscribeAllUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from all</a> | <a href="${settingsUrl}" style="color: #667eea;">Manage preferences</a>`;
  
  return text;
}

/**
 * Friend Request Received Email
 */
export function friendRequestReceivedEmail(sender: UserData, recipient: UserData, locale: Locale = 'en') {
  const t = emailTranslations[locale].friendRequest;
  const recipientId = (recipient as any)?._id || '';
  
  return {
    subject: t.subject(sender.name || 'Someone'),
    text: `${t.greeting(recipient.name || 'there')} ${sender.name || 'A dancer'} ${t.wantsToConnect}`,
    headers: recipientId ? {
      'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${recipientId}&type=friendRequest>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .profile-card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .profile-image { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">👋 ${t.header}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting(recipient.name || 'there')}</p>
              <div class="profile-card">
                ${sender.image 
                  ? `<img src="${sender.image}" alt="${sender.name}" class="profile-image" />` 
                  : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${sender.name?.[0] || 'D'}</div>`
                }
                <h2 style="margin: 10px 0; color: #333;">${sender.name || 'A dancer'}</h2>
                ${sender.username ? `<p style="color: #666; margin: 5px 0;">@${sender.username}</p>` : ''}
                <p style="color: #666; margin: 10px 0;">${t.wantsToConnect}</p>
              </div>
              <div style="text-align: center;">
                <a href="https://${config.domainName}/${locale}/friends" class="button">${t.viewButton}</a>
              </div>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ${t.footer1}
              </p>
            </div>
            <div class="footer">
              <p>${t.footer2(config.appName)}</p>
              <p style="margin-top: 10px;">${recipientId ? getUnsubscribeFooter(recipientId, 'friendRequest', locale) : `<a href="https://${config.domainName}/settings" style="color: #667eea;">${t.managePrefs}</a>`}</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

/**
 * Friend Request Accepted Email
 */
export function friendRequestAcceptedEmail(accepter: UserData, sender: UserData, locale: Locale = 'en') {
  const t = emailTranslations[locale].friendAccepted;
  const senderId = sender._id || '';
  
  return {
    subject: t.subject(accepter.name || 'Someone'),
    text: `${t.greeting(sender.name || 'there')} ${accepter.name || 'A dancer'} accepted your friend request on ${config.appName}.`,
    headers: senderId ? {
      'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${senderId}&type=friendRequest>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .profile-card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .profile-image { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 ${t.header}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting(sender.name || 'there')}</p>
              <p style="font-size: 16px; margin-bottom: 20px;">${t.greatNews(accepter.name || 'A dancer')}</p>
              <div class="profile-card">
                ${accepter.image 
                  ? `<img src="${accepter.image}" alt="${accepter.name}" class="profile-image" />` 
                  : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${accepter.name?.[0] || 'D'}</div>`
                }
                <h2 style="margin: 10px 0; color: #333;">${accepter.name || t.newFriend}</h2>
                ${accepter.username ? `<p style="color: #666; margin: 5px 0;">@${accepter.username}</p>` : ''}
              </div>
              <div style="text-align: center;">
                <a href="https://${config.domainName}/${locale}/${accepter.username || `dancer/${accepter._id}`}" class="button">${t.viewButton}</a>
              </div>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ${t.footer1}
              </p>
            </div>
            <div class="footer">
              <p>${t.footer2(config.appName)}</p>
              <p style="margin-top: 10px;">${senderId ? getUnsubscribeFooter(senderId, 'friendRequest', locale) : `<a href="https://${config.domainName}/settings" style="color: #667eea;">${t.managePrefs}</a>`}</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

/**
 * Message Received Email
 */
export function messageReceivedEmail(
  sender: UserData, 
  recipient: UserData, 
  messagePreview: string, 
  conversationId: string,
  locale: Locale = 'en'
) {
  const t = emailTranslations[locale].messageReceived;
  const messageSnippet = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
  const recipientId = (recipient as any)?._id || '';
  
  return {
    subject: t.subject(sender.name || 'Someone'),
    text: `${t.greeting(recipient.name || 'there')} ${sender.name || 'A dancer'} ${t.sentMessage} "${messageSnippet}"`,
    headers: recipientId ? {
      'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${recipientId}&type=message>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .profile-card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .profile-image { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover; }
            .message-preview { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #555; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">💬 ${t.header}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting(recipient.name || 'there')}</p>
              <div class="profile-card">
                ${sender.image 
                  ? `<img src="${sender.image}" alt="${sender.name}" class="profile-image" />` 
                  : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${sender.name?.[0] || 'D'}</div>`
                }
                <h2 style="margin: 10px 0; color: #333;">${sender.name || 'A dancer'}</h2>
                ${sender.username ? `<p style="color: #666; margin: 5px 0;">@${sender.username}</p>` : ''}
                <p style="color: #666; margin: 10px 0;">${t.sentMessage}</p>
                <div class="message-preview">
                  "${messageSnippet}"
                </div>
              </div>
              <div style="text-align: center;">
                <a href="https://${config.domainName}/${locale}/messages/${conversationId}" class="button">${t.viewButton}</a>
              </div>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ${t.footer1}
              </p>
            </div>
            <div class="footer">
              <p>${t.footer2(config.appName)}</p>
              <p style="margin-top: 10px;">${recipientId ? getUnsubscribeFooter(recipientId, 'message', locale) : `<a href="https://${config.domainName}/settings" style="color: #667eea;">${t.managePrefs}</a>`}</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

/**
 * Campaign / Promotional Email
 */
export function campaignEmail(
  { subject, bodyText, imageUrl, ctaLink, ctaText }: {
    subject: string;
    bodyText: string;
    imageUrl?: string;
    ctaLink?: string;
    ctaText?: string;
  },
  recipientId: string,
  locale: Locale = 'en'
) {
  const t = emailTranslations[locale].campaign;
  const buttonText = ctaText || t.defaultButton;

  return {
    subject,
    text: bodyText,
    headers: recipientId ? {
      'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${recipientId}&type=all>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .event-image { width: 100%; max-width: 560px; border-radius: 10px; margin: 20px 0; }
            .body-text { font-size: 16px; color: #333; white-space: pre-line; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">${subject}</h1>
            </div>
            <div class="content">
              ${imageUrl ? `<img src="${imageUrl}" alt="Event" class="event-image" />` : ''}
              <div class="body-text">${bodyText.replace(/\n/g, '<br/>')}</div>
              ${ctaLink ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${ctaLink}" class="button">${buttonText}</a>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>${t.footer(config.appName)}</p>
              <p style="margin-top: 10px;">${recipientId ? getUnsubscribeFooter(recipientId, 'all', locale) : `<a href="https://${config.domainName}/settings" style="color: #667eea;">${t.managePrefs}</a>`}</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

/**
 * Profile Liked Email
 */
export function profileLikedEmail(liker: UserData, recipient: UserData, locale: Locale = 'en') {
  const t = emailTranslations[locale].profileLiked;
  const recipientId = (recipient as any)?._id || '';
  
  return {
    subject: t.subject(liker.name || 'Someone'),
    text: `${t.greeting(recipient.name || 'there')} ${liker.name || 'A dancer'} ${t.likedProfile}`,
    headers: recipientId ? {
      'List-Unsubscribe': `<https://${config.domainName}/api/unsubscribe?userId=${recipientId}&type=profileLiked>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 40px 30px; }
            .profile-card { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .profile-image { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .heart { font-size: 40px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">❤️ ${t.header}</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting(recipient.name || 'there')}</p>
              <div class="heart">❤️</div>
              <div class="profile-card">
                ${liker.image 
                  ? `<img src="${liker.image}" alt="${liker.name}" class="profile-image" />` 
                  : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold;">${liker.name?.[0] || 'D'}</div>`
                }
                <h2 style="margin: 10px 0; color: #333;">${liker.name || 'A dancer'}</h2>
                ${liker.username ? `<p style="color: #666; margin: 5px 0;">@${liker.username}</p>` : ''}
                <p style="color: #666; margin: 10px 0;">${t.likedProfile}</p>
              </div>
              <div style="text-align: center;">
                <a href="https://${config.domainName}/${locale}/${liker.username || `dancer/${liker._id}`}" class="button">${t.viewButton}</a>
              </div>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ${t.footer1}
              </p>
            </div>
            <div class="footer">
              <p>${t.footer2(config.appName)}</p>
              <p style="margin-top: 10px;">${recipientId ? getUnsubscribeFooter(recipientId, 'profileLiked', locale) : `<a href="https://${config.domainName}/settings" style="color: #667eea;">${t.managePrefs}</a>`}</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

