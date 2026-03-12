import { redirect } from "next/navigation";

// Redirect to cache settings by default
export default function AdminPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin/cache`);
}

