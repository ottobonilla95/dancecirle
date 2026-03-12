import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import InviteFriends from "@/components/InviteFriends";
import BackButton from "@/components/BackButton";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { getMessages, getTranslation } from "@/lib/i18n";

export const metadata = {
  title: "Invite Friends | DanceCircle",
  description:
    "Invite your dance friends to join DanceCircle and grow the global dance community",
};

export default async function InvitePage({ params }: { params: { locale: string } }) {
  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Session is already validated in layout
  const session = await getServerSession(authOptions);

  // Fetch user data
  await connectMongo();
  const user = await User.findById(session!.user.id).select("name").lean();

  if (!user) {
    redirect(`/${params.locale}/dashboard`);
  }

  // Type cast to avoid Mongoose lean() typing issues
  const userData = user as any;

  return (
    <div className="min-h-screen p-4 bg-base-100">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton label={t('invitePage.back')} href="/dashboard" />
        </div>

        {/* Main Content */}
        <InviteFriends userName={userData.name} />

        {/* Additional CTA */}
        <div className="mt-8 space-y-6">
          {/* Main Vision */}
          <div className="card bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30">
            <div className="card-body">
              <h3 className="card-title justify-center text-2xl mb-2">
                🌍 {t('invitePage.buildingSomethingSpecial')}
              </h3>
              <p className="text-base-content/80 mb-4">
                {t('invitePage.imagineWorld')} 🔥
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-sm">
                <div className="badge badge-lg badge-primary gap-2">
                  🕺 {t('invitePage.connectGlobally')}
                </div>
                <div className="badge badge-lg badge-secondary gap-2">
                  🌎 {t('invitePage.danceLocally')}
                </div>
                <div className="badge badge-lg badge-accent gap-2">
                  💃 {t('invitePage.uniteDancers')}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">💬</div>
                <h4 className="font-bold">{t('invitePage.shareDaily')}</h4>
                <p className="text-sm text-base-content/70">
                  {t('invitePage.postAbout')}
                </p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">🎪</div>
                <h4 className="font-bold">{t('invitePage.inviteInPerson')}</h4>
                <p className="text-sm text-base-content/70">
                  {t('invitePage.tellDancers')}
                </p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">📱</div>
                <h4 className="font-bold">{t('invitePage.shareYourProfile')}</h4>
                <p className="text-sm text-base-content/70">
                  {t('invitePage.postProfileCard')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
