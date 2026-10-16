import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { usePrayer } from "./prayer";
import { usePrefs } from "./store";
export function PrayerReminder() {
  const { reminders, reminderOffset } = usePrefs();
  const { next, now } = usePrayer();
  const sent = useRef("");
  useEffect(() => {
    if (
      !reminders ||
      !next ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const remaining = +next.time - +now - reminderOffset * 60000;
    const key = next.key + next.time.toISOString();
    if (remaining <= 0 && remaining > -60000 && sent.current !== key) {
      sent.current = key;
      new Notification("منارة — " + next.name, {
        body: reminderOffset
          ? `تبقّى ${reminderOffset} دقائق على الصلاة`
          : "حان وقت الصلاة",
        icon: "/images/app-icon-192.png",
        tag: key,
      });
    }
  }, [next, now, reminders, reminderOffset]);
  return null;
}
export function NotificationSettings() {
  const prefs = usePrefs();
  const [status, setStatus] = useState("");
  return (
    <div className="settings-card" id="notifications">
      <h2>
        <Bell size={21} /> تذكير الصلاة
      </h2>
      <p>
        تعمل التذكيرات أثناء فتح التطبيق. قد يوقف المتصفح التنبيهات عندما يكون
        التطبيق مغلقًا أو في الخلفية.
      </p>
      <button
        className="secondary"
        onClick={async () => {
          if (prefs.reminders) {
            prefs.set({ reminders: false });
            return;
          }
          if (!("Notification" in window)) {
            setStatus("هذا المتصفح لا يدعم الإشعارات");
            return;
          }
          const permission = await Notification.requestPermission();
          prefs.set({ reminders: permission === "granted" });
          setStatus(
            permission === "granted"
              ? "تم تفعيل التذكيرات"
              : "لم يُسمح بالإشعارات. يمكنك تعديل الإذن من إعدادات المتصفح.",
          );
        }}
      >
        {prefs.reminders ? "إيقاف التذكيرات" : "تفعيل التذكيرات"}
      </button>
      <label className="setting-row">
        وقت التذكير
        <select
          value={prefs.reminderOffset}
          onChange={(e) =>
            prefs.set({ reminderOffset: Number(e.target.value) })
          }
        >
          <option value="0">عند الصلاة</option>
          <option value="5">قبل الصلاة بخمس دقائق</option>
          <option value="10">قبل الصلاة بعشر دقائق</option>
        </select>
      </label>
      <p role="status">{status}</p>
    </div>
  );
}
