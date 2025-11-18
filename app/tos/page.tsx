import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Terms of Service | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
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
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms of Service for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: November 2, 2025

IMPORTANT NOTICE: These Terms of Service constitute a legal agreement. Please review them carefully. If you have any questions or concerns, consult with a qualified attorney before using our Services.

AGREEMENT TO TERMS

Welcome to DanceCircle! These Terms of Service ("Terms") constitute a legally binding agreement between you and JMO Ventures LLC ("DanceCircle," "we," "us," or "our") governing your access to and use of the DanceCircle website at https://dancecircle.co and related services (collectively, the "Services").

By accessing or using DanceCircle, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use our Services.

1. DESCRIPTION OF SERVICES

DanceCircle is a social networking platform designed to connect dancers worldwide. Our Services include:

• Creating dancer profiles with information about your dance styles, experience, and preferences
• Discovering and connecting with dancers in cities around the world
• Sharing your dance journey, including cities visited, dance anthems, and upcoming trips
• Finding dance teachers, DJs, photographers, and event organizers
• Accessing information about dance styles, cities, and dance communities
• Connecting with friends and building your dance network
• Viewing and participating in the global dance community

2. ELIGIBILITY

2.1 Age Requirements
You must be at least 16 years old to use DanceCircle. If you are under 18, you must have permission from a parent or legal guardian to use our Services.

In some jurisdictions, different age requirements may apply. By using our Services, you represent that you meet the minimum age requirements in your jurisdiction.

2.2 Account Accuracy
You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.

2.3 Single Account
You may only create and maintain one account. Multiple accounts or impersonation of others is prohibited.

3. USER ACCOUNTS

3.1 Account Creation
To access most features, you must create an account by providing:
• Valid email address
• First and last name
• Username
• Password (kept secure and encrypted)

You may also complete your profile with additional information such as dance styles, location, photos, and professional details.

3.2 Account Security
You are responsible for:
• Maintaining the confidentiality of your password
• All activities that occur under your account
• Notifying us immediately of any unauthorized use

We are not liable for any loss or damage arising from your failure to protect your account credentials.

3.3 Account Termination
You may delete your account at any time through your profile settings. Upon deletion, your personal data will be removed within 30 days, except where retention is required by law.

We reserve the right to suspend or terminate accounts that violate these Terms.

4. USER CONTENT AND CONDUCT

4.1 Your Content
You retain ownership of content you post on DanceCircle ("User Content"), including:
• Profile information and photos
• Bio and descriptions
• Comments and suggestions
• Any other content you upload or share

4.2 License to DanceCircle
By posting User Content, you grant DanceCircle a worldwide, non-exclusive, royalty-free, transferable license to use, display, reproduce, and distribute your User Content solely for the purpose of providing and improving our Services.

4.3 Public Profiles
You understand and agree that:
• Your profile is PUBLIC and visible to all registered users
• Other users can view your dance information, location, and social connections
• You should not share sensitive information you wish to keep private
• You can manage certain privacy settings in your profile

4.4 Prohibited Conduct
You agree NOT to:

• Post false, misleading, or inaccurate information
• Impersonate any person or entity
• Harass, bully, threaten, or intimidate other users
• Post sexually explicit, violent, or offensive content
• Discriminate based on race, gender, religion, nationality, disability, sexual orientation, or age
• Spam or send unsolicited commercial messages
• Use automated tools (bots, scrapers) to access our Services
• Attempt to hack, interfere with, or compromise our platform security
• Violate any applicable laws or regulations
• Infringe on intellectual property rights of others
• Post content that promotes illegal activities
• Sell or transfer your account to others
• Use DanceCircle for any commercial purpose without our prior written consent

4.5 Content Moderation
We reserve the right (but have no obligation) to:
• Monitor and review User Content
• Remove or refuse to display content that violates these Terms
• Suspend or terminate accounts that engage in prohibited conduct

We are not responsible for User Content posted by others.

5. INTELLECTUAL PROPERTY

5.1 DanceCircle Ownership
All content and materials on DanceCircle (excluding User Content) are owned by JMO Ventures LLC and protected by copyright, trademark, and other intellectual property laws. This includes:
• The DanceCircle name, logo, and branding
• Platform design, layout, and user interface
• Software, code, and algorithms
• Text, graphics, images, and other content we create

5.2 Limited License
We grant you a limited, non-exclusive, non-transferable license to access and use DanceCircle for personal, non-commercial purposes in accordance with these Terms.

You may NOT:
• Copy, modify, or create derivative works of our platform
• Reverse engineer or attempt to extract source code
• Use our branding without permission
• Resell or redistribute our Services

6. THIRD-PARTY SERVICES

DanceCircle integrates with third-party services, including:
• Stripe: Payment processing
• ImageKit: Image and video hosting
• Spotify: Music links
• Social media platforms (Instagram, TikTok, YouTube)
• Google Maps/Mapbox: Location services

Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for their practices or any issues arising from their use.

7. PAYMENTS AND SUBSCRIPTIONS

7.1 Payment Processing
All payments are processed securely through Stripe. We do not store your full credit card information.

7.2 Pricing
Pricing for any paid features will be clearly displayed. We reserve the right to change prices at any time, but will notify you in advance of any changes affecting your existing subscription.

7.3 Refund Policy
If you are dissatisfied with paid features, please contact us at ${config.resend?.supportEmail || 'support@dancecircle.co'} within 7 days of purchase to request a refund. Refunds are granted at our sole discretion.

7.4 Auto-Renewal
If you purchase a subscription, it will automatically renew at the end of each billing period unless you cancel before the renewal date.

8. DISCLAIMERS AND LIMITATIONS OF LIABILITY

8.1 "AS IS" Service
DANCECIRCLE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

We do not guarantee that:
• The Services will be uninterrupted, secure, or error-free
• Defects will be corrected
• The platform is free of viruses or harmful components
• User information is accurate or reliable

8.2 User Interactions
We are NOT responsible for:
• Interactions between users (whether online or offline)
• The conduct of other users
• Content posted by other users
• Disputes between users
• Any harm arising from meeting other users in person

YOU ASSUME ALL RISKS associated with using DanceCircle and interacting with other users. Always exercise caution when meeting people you've connected with online.

8.3 Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, JMO VENTURES LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:

• Your use or inability to use the Services
• Any unauthorized access to or use of our servers or your personal information
• Any interruption or cessation of transmission to or from the Services
• Any bugs, viruses, or harmful code transmitted through the Services
• Any errors or omissions in content
• User Content or conduct of any third party

IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE PAST SIX MONTHS, OR $100, WHICHEVER IS GREATER.

Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.

9. INDEMNIFICATION

You agree to indemnify, defend, and hold harmless JMO Ventures LLC, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to:

• Your use of DanceCircle
• Your violation of these Terms
• Your violation of any rights of another person or entity
• Your User Content

10. PRIVACY

Your privacy is important to us. Please review our Privacy Policy at https://dancecircle.co/privacy-policy to understand how we collect, use, and protect your personal information.

11. TERMINATION

11.1 By You
You may terminate your account at any time by using the "Delete Account" feature in your profile settings.

11.2 By Us
We may suspend or terminate your access to DanceCircle immediately, without prior notice, if:
• You violate these Terms
• You engage in fraudulent or illegal activity
• We are required to do so by law
• We discontinue the Services

11.3 Effect of Termination
Upon termination:
• Your right to use the Services will cease immediately
• Your profile and User Content will be removed (within 30 days)
• You remain liable for any obligations incurred before termination

Sections that by their nature should survive termination will remain in effect, including intellectual property provisions, disclaimers, limitations of liability, and dispute resolution.

12. DISPUTE RESOLUTION

12.1 Governing Law
These Terms are governed by the laws of the United States and the State of [YOUR STATE], without regard to conflict of law principles.

12.2 Informal Resolution
Before filing any legal claim, you agree to contact us at ${config.resend?.supportEmail || 'support@dancecircle.co'} to attempt to resolve the dispute informally.

12.3 Arbitration Agreement
Any disputes arising from these Terms or your use of DanceCircle will be resolved through binding arbitration, rather than in court, except where prohibited by law. You and DanceCircle waive the right to a jury trial.

Arbitration will be conducted by the American Arbitration Association (AAA) under its rules. You may opt out of arbitration within 30 days of first using DanceCircle by sending written notice to: ${config.resend?.supportEmail || 'support@dancecircle.co'}

12.4 Class Action Waiver
You agree to bring claims only in your individual capacity and not as part of any class or representative action. This waiver does not apply where prohibited by law.

13. CHANGES TO THESE TERMS

We reserve the right to modify these Terms at any time. When we make changes:
• We will post the updated Terms with a new "Last Updated" date
• We will notify you via email for material changes
• Your continued use of DanceCircle after changes become effective constitutes acceptance

If you do not agree to modified Terms, you must stop using our Services.

14. GENERAL PROVISIONS

14.1 Entire Agreement
These Terms, together with our Privacy Policy, constitute the entire agreement between you and DanceCircle regarding the Services.

14.2 Severability
If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.

14.3 Waiver
Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.

14.4 Assignment
You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.

14.5 Force Majeure
We are not liable for any failure or delay in performing our obligations due to circumstances beyond our reasonable control (e.g., natural disasters, wars, pandemics, internet outages).

14.6 Notices
We may provide notices to you via email at the address associated with your account or by posting on the platform. You agree to receive electronic communications from us.

15. CONTACT INFORMATION

If you have questions or concerns about these Terms of Service, please contact us:

Email: ${config.resend?.supportEmail || 'support@dancecircle.co'}
Website: https://dancecircle.co
Company: JMO Ventures LLC

For legal inquiries, please include "Legal Notice" in your subject line.

---

BY USING DANCECIRCLE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.

---

DISCLAIMER: These Terms of Service are provided as a starting point and should be reviewed and customized by a qualified attorney to ensure compliance with all applicable laws in your jurisdiction. Laws vary by country, state, and region, and this document may not cover all legal requirements specific to your situation.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
