import { Link } from "@/navigation";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-4xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: November 2, 2025

IMPORTANT NOTICE: This Privacy Policy has been drafted to comply with applicable data protection laws. However, it should be reviewed by a qualified attorney to ensure full legal compliance in your jurisdiction.

Introduction

Welcome to DanceCircle ("we," "us," "our," or "the Platform"). This Privacy Policy explains how JMO Ventures LLC collects, uses, shares, and protects your personal information when you use our website at https://dancecircle.co and our related services (collectively, the "Services").

By accessing or using DanceCircle, you agree to the terms of this Privacy Policy. If you do not agree, please do not use our Services.

1. INFORMATION WE COLLECT

1.1 Personal Information You Provide

When you create an account and use DanceCircle, we collect:

• Account Information: Email address, password (encrypted), first name, last name, username
• Profile Information: Profile photo, date of birth, gender, nationality, relationship status
• Dance Information: Dance styles you practice, skill levels, dance role (leader/follower/both), years of dancing experience, cities where you've danced
• Location Data: Current city, cities visited, country, continent
• Professional Information (if applicable): Teacher bio, years of teaching experience, DJ name and genres, photographer portfolio, event organizer details, professional contact information (WhatsApp, email)
• Social Information: Dance anthem (Spotify links), social media handles (Instagram, TikTok, YouTube), bio
• Communication Data: Friend connections, messages, suggestions and feedback you submit
• Trip Information: Upcoming trips and travel plans you share

1.2 Automatically Collected Information

When you use our Services, we automatically collect:

• Usage Data: Pages viewed, features used, time spent on the platform, search queries
• Device Information: IP address, browser type, device type, operating system, device identifiers
• Location Information: Approximate location based on IP address
• Cookies and Tracking: We use cookies, web beacons, and similar technologies (see Section 8)

1.3 Information from Third Parties

• Authentication Data: If you sign in with email magic links, we process authentication tokens
• Payment Information: We use Stripe to process payments. We do not store your full credit card information on our servers
• Social Media: If you link your social media accounts, we may display your public profile information

2. HOW WE USE YOUR INFORMATION

We use your information to:

2.1 Provide and Improve Services
• Create and manage your account
• Display your public dancer profile
• Connect you with other dancers in your city and worldwide
• Show you personalized content (nearby dancers, events, cities)
• Enable friend connections and social features
• Process your suggestions and feedback
• Improve our platform and develop new features

2.2 Communications
• Send you account-related notifications
• Respond to your inquiries and support requests
• Send administrative updates about our Services
• Notify you of friend requests and platform activity
• Send reminder emails if your profile is incomplete (you can opt out)

2.3 Safety and Security
• Verify your identity and prevent fraud
• Monitor for suspicious activity
• Enforce our Terms of Service
• Comply with legal obligations

2.4 Analytics and Marketing
• Analyze usage patterns to improve user experience
• Track engagement with Facebook Pixel for advertising purposes
• Create aggregated, anonymized statistics about our community

3. HOW WE SHARE YOUR INFORMATION

3.1 Public Information

By default, certain information is PUBLIC and visible to all DanceCircle users:
• Your profile photo, name, username
• Dance styles and skill levels
• Dance role (leader/follower/both)
• Current city and cities visited
• Bio and dance anthem
• Social media handles
• Professional profiles (if you're a teacher/DJ/photographer/event organizer)
• Friend connections
• Upcoming trips

You can manage some privacy settings in your profile.

3.2 With Other Users
• Your profile is searchable and viewable by other registered users
• Friend requests allow users to connect with you
• Users can see mutual friends you have in common

3.3 Service Providers

We share data with trusted third-party service providers who assist us:
• ImageKit: Image and video hosting and delivery
• Stripe: Payment processing
• MongoDB Atlas: Database hosting
• Vercel: Platform hosting
• Resend: Email delivery
• Facebook: Analytics via Facebook Pixel
• Google Maps/Mapbox: Location services

These providers are contractually obligated to protect your data.

3.4 Legal Requirements

We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.

3.5 Business Transfers

If DanceCircle is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.

3.6 With Your Consent

We may share your information in other ways with your explicit consent.

4. DATA RETENTION

We retain your information as long as:
• Your account is active
• Needed to provide our Services
• Required by law or for legitimate business purposes

When you delete your account, we will delete or anonymize your personal information within 30 days, except where we must retain it for legal compliance.

5. YOUR RIGHTS AND CHOICES

Depending on your location, you may have the following rights:

5.1 Access and Portability
• Request a copy of your personal data
• Export your data in a portable format

5.2 Correction
• Update or correct inaccurate information in your profile settings

5.3 Deletion
• Delete your account and personal information (except where retention is required by law)
• Use the "Delete Account" button in your profile settings

5.4 Opt-Out
• Unsubscribe from marketing emails (link in email footer)
• Disable cookies in your browser settings
• Request to opt out of analytics tracking

5.5 Restrict Processing
• Request that we limit how we use your data

5.6 Object
• Object to processing of your data for certain purposes

To exercise these rights, contact us at: ${config.resend?.supportEmail || 'support@dancecircle.co'}

6. INTERNATIONAL DATA TRANSFERS

DanceCircle is based in the United States. If you are located outside the U.S., your information will be transferred to and processed in the U.S. By using our Services, you consent to this transfer.

For users in the European Economic Area (EEA) and UK, we implement appropriate safeguards to protect your data in accordance with GDPR.

7. DATA SECURITY

We implement industry-standard security measures to protect your information:
• Encryption of data in transit (HTTPS/TLS)
• Encrypted storage of passwords
• Regular security audits
• Access controls and authentication
• Secure cloud infrastructure

However, no system is 100% secure. We cannot guarantee absolute security of your data.

8. COOKIES AND TRACKING TECHNOLOGIES

We use cookies and similar technologies to:
• Keep you logged in
• Remember your preferences
• Analyze usage patterns
• Enable social features
• Serve relevant content

Types of cookies we use:
• Essential Cookies: Required for the platform to function
• Analytics Cookies: Help us understand how you use the platform
• Advertising Cookies: Facebook Pixel for ad targeting (you can opt out)

You can control cookies through your browser settings, but disabling them may limit platform functionality.

9. THIRD-PARTY LINKS

DanceCircle may contain links to external websites (e.g., Spotify, Instagram, user-submitted websites). We are not responsible for the privacy practices of these third parties. Please review their privacy policies.

10. CHILDREN'S PRIVACY

DanceCircle is intended for users aged 16 and older. We do not knowingly collect information from children under 16. If you believe a child under 16 has provided us with personal information, please contact us immediately, and we will delete it.

Note: Some jurisdictions may have different age requirements (e.g., 13+ in the U.S. with parental consent).

11. CALIFORNIA PRIVACY RIGHTS (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

• Right to Know: What personal information we collect, use, and share
• Right to Delete: Request deletion of your personal information
• Right to Opt-Out: Opt out of sale of personal information (we do not sell your data)
• Right to Non-Discrimination: We will not discriminate against you for exercising your rights

To exercise these rights, contact us at: ${config.resend?.supportEmail || 'support@dancecircle.co'}

12. EUROPEAN PRIVACY RIGHTS (GDPR)

If you are located in the EEA or UK, you have rights under GDPR, including:

• Right to Access, Rectification, Erasure, Restriction, and Portability (see Section 5)
• Right to Object to processing
• Right to Withdraw Consent
• Right to Lodge a Complaint with your local data protection authority

Legal basis for processing:
• Consent: For optional features like analytics
• Contract: To provide our Services
• Legitimate Interests: To improve our platform and ensure security
• Legal Obligation: To comply with applicable laws

13. UPDATES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. We will notify you of significant changes by:
• Posting the new policy on this page with an updated "Last Updated" date
• Sending an email notification to registered users (for material changes)

Your continued use of DanceCircle after changes become effective constitutes acceptance of the updated policy.

14. CONTACT US

If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: ${config.resend?.supportEmail || 'support@dancecircle.co'}
Website: https://dancecircle.co
Company: JMO Ventures LLC

For GDPR-related inquiries, please include "GDPR Request" in your subject line.
For CCPA-related inquiries, please include "CCPA Request" in your subject line.

---

DISCLAIMER: This Privacy Policy is provided as a starting point and should be reviewed by a qualified attorney to ensure compliance with all applicable laws in your jurisdiction. Laws vary by country, state, and region, and this document may not cover all legal requirements.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
