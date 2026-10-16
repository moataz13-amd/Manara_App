import { useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import { Cloud, LogIn } from "lucide-react";
import { usePrefs } from "./store";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const client = url && key ? createClient(url, key) : null;
export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!client) return;
    client.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = client.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  const sync = async () => {
    if (!client || !user) return;
    setBusy(true);
    setMessage("");
    const s = usePrefs.getState();
    const snapshot = {
      theme: s.theme,
      fontSize: s.fontSize,
      place: s.place,
      method: s.method,
      hanafi: s.hanafi,
      hour12: s.hour12,
      last: s.last,
      bookmarks: s.bookmarks,
      counts: s.counts,
      favorites: s.favorites,
      tasbih: s.tasbih,
      target: s.target,
      reciter: s.reciter,
    };
    const { error } = await client
      .from("user_snapshots")
      .upsert({
        user_id: user.id,
        data: snapshot,
        updated_at: new Date().toISOString(),
      });
    setMessage(
      error
        ? "تعذّر رفع البيانات. حاول مرة أخرى."
        : "تم حفظ نسخة من بياناتك في حسابك.",
    );
    setBusy(false);
  };
  return (
    <div className="settings-card">
      <h2>
        <Cloud size={21} /> حسابك والمزامنة
      </h2>
      {!client ? (
        <p>
          المزامنة السحابية غير مفعّلة في هذه النسخة. يمكنك استخدام جميع الأقسام
          وحفظ تقدمك على جهازك.
        </p>
      ) : user ? (
        <>
          <p>{user.email}</p>
          <button disabled={busy} className="primary" onClick={sync}>
            حفظ بياناتي في الحساب
          </button>
          <button
            disabled={busy}
            className="secondary"
            onClick={async () => {
              setBusy(true);
              const { data, error } = await client
                .from("user_snapshots")
                .select("data")
                .eq("user_id", user.id)
                .maybeSingle();
              if (error) setMessage("تعذّر استعادة البيانات");
              else if (!data) setMessage("لا توجد نسخة محفوظة بعد");
              else {
                const local = usePrefs.getState();
                const remote = data.data;
                local.set({
                  bookmarks: [
                    ...new Set([
                      ...local.bookmarks,
                      ...(Array.isArray(remote.bookmarks)
                        ? remote.bookmarks.filter(
                            (b: unknown) =>
                              typeof b === "string" &&
                              /^\d{1,3}:\d{1,3}$/.test(b),
                          )
                        : []),
                    ]),
                  ],
                  favorites: [
                    ...new Set([
                      ...local.favorites,
                      ...(Array.isArray(remote.favorites)
                        ? remote.favorites.filter((n: unknown) =>
                            Number.isInteger(n),
                          )
                        : []),
                    ]),
                  ],
                });
                setMessage(
                  "تم دمج العلامات المرجعية والأذكار المفضلة. احتُفظ بإعدادات هذا الجهاز.",
                );
              }
              setBusy(false);
            }}
          >
            استعادة العلامات والمفضلة
          </button>
          <button
            onClick={async () => {
              await client.auth.signOut();
              setMessage("تم تسجيل الخروج");
            }}
          >
            تسجيل الخروج
          </button>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await client.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: window.location.origin + "/settings",
              },
            });
            setMessage(
              error
                ? "تعذّر إرسال رابط الدخول. تحقق من البريد والإعدادات."
                : "أرسلنا رابط تسجيل الدخول إلى بريدك.",
            );
            setBusy(false);
          }}
        >
          <p>ادخل ببريدك لحفظ نسخة من تقدمك واستعادتها على جهاز آخر.</p>
          <label>
            البريد الإلكتروني
            <input
              className="account-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              dir="ltr"
            />
          </label>
          <button disabled={busy} className="primary">
            <LogIn size={16} />
            {busy ? "جارٍ الإرسال…" : "أرسل رابط الدخول"}
          </button>
        </form>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
